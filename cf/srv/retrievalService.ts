import cds, { db } from '@sap/cds'
import { Settings } from './settings'
import {
    dateToYearMonth,
    fixDecimals,
    dateToISODate,
    groupByKeys,
    flattenObject,
    lastDayOfMonth
} from './functions'

import {
    api_monthlyUsage,
    api_monthlyCost
} from './api_uasReporting'

import {
    MonthlyCostResponseObject,
    MonthlyUsageResponseObject
} from './external/APIUasReportingService'

import {
    ResourceEventsApi,
    CustomerResourceEvent
} from './external/APIAlertNotificationService'

import {
    TAggregationLevel,
    TAlertType,
    TForecastMethod,
    TInExclude,
    TInterval,
    TServiceScopes,
} from '#cds-models/types'

import {
    Alert,
    Alerts,
    AlertThreshold,

    BTPService,
    BTPServices,

    CommercialMetric,
    CommercialMetrics,
    CommercialMeasure,
    CommercialMeasures,
    ForecastSetting,
    ForecastSettings,

    TechnicalMetric,
    TechnicalMetrics,
    TechnicalMeasure,
    TechnicalMeasures,
} from '#cds-models/db'

import {
    TCommercialMeasure,
    TTechnicalMeasure
} from '#cds-models/api'

import {
    downloadMeasuresForToday,
    downloadMeasuresForPastMonths,
    deleteAllData,
    resetForecastSettings,
    calculateCommercialForecasts,
    prepareCommercialMeasureMetricForecasts,
    prepareCommercialMeasureServiceForecasts,
    calculateCommercialForecastsForService,
    testAlert
} from '#cds-models/RetrievalService'
import { CdsDate } from '#cds-models/_'


const info = cds.log('retrievalService').info

// import { cost_data } from './demo_cost';
// import { usage_data } from './demo_usage';

type alertTableColumn = {
    title: string
    width: number
    value: string
    padStart?: boolean
}
type UUID = `${string}-${string}-${string}-${string}-${string}`

export default class RetrievalService extends cds.ApplicationService {
    async init() {

        /**
         * This function can be called every day and retrieves current/ongoing's months measures only
         */
        this.on(downloadMeasuresForToday, async req => {
            let status = []

            const thisMonth = Number(dateToYearMonth())
            status.push(await retrieveTechnicalData({ fromDate: thisMonth, toDate: thisMonth }, TInterval.Daily))
            status.push(await retrieveCommercialData({ fromDate: thisMonth, toDate: thisMonth }, TInterval.Daily))
            status.push(await updateCommercialMetricForecasts())
            status.push(await updateCommercialServiceForecasts())
            status.push(await sendNotification())

            return status.join('\r\n')
        })

        /**
         * This function can be called ad-hoc or every day to update historic measures, and retrieves data upto the previous month only
         * If fromDate is not specified, the 1 previous month is retrieved
         * Previous month calculation:
         *     202312 has to become 202311 = -1
         *     202401 has to become 202312 = -1-88
         *     202402 has to become 202401 = -1
         */
        this.on(downloadMeasuresForPastMonths, async req => {
            let status = []

            const thisMonth = dateToYearMonth()
            const pastMonth = thisMonth.endsWith('01') ? Number(thisMonth) - 1 - 88 : Number(thisMonth) - 1
            status.push(await retrieveTechnicalData({ fromDate: req.data.fromDate || pastMonth, toDate: pastMonth }, TInterval.Monthly))
            status.push(await retrieveCommercialData({ fromDate: req.data.fromDate || pastMonth, toDate: pastMonth }, TInterval.Monthly))
            status.push(await updateCommercialMetricForecasts())
            status.push(await updateCommercialServiceForecasts())

            return status.join('\r\n')
        })

        /**
         * This function removes ALL usage data from the database
         */
        this.on(deleteAllData, async req => {
            await DELETE.from(BTPServices)
            return `All consumption data has been removed from the database.`
        })

        /**
         * This function resets all Forecast Settings back to the default setting
         */
        this.on(resetForecastSettings, async req => {
            let status = []

            const forecastSetting = {
                ...Settings.defaultValues.forecastSetting
            }
            const rows = await UPDATE(ForecastSettings).with(forecastSetting)
            status.push(`${rows} forecast settings have been reverted to ${forecastSetting.method}, factor ${forecastSetting.degressionFactor}.`)

            status.push(await updateCommercialMetricForecasts())
            status.push(await updateCommercialServiceForecasts())

            return status.join('\r\n')
        })

        // Received from Presentation Service when a metric has its Forecast Settings changed, or 'recalculate all' is clicked
        this.on(calculateCommercialForecasts, async req => {
            let status = []
            status.push(await updateCommercialMetricForecasts())
            status.push(await updateCommercialServiceForecasts())
            return status.join('\r\n')
        })

        // Received from Presentation Service when a metric has its Forecast Settings changed, or a commercial item is deleted
        this.on(calculateCommercialForecastsForService, async req => {
            let status = []
            const { serviceName } = req.data
            status.push(await updateCommercialMetricForecasts(serviceName as string)) // calcalates forecasts
            status.push(await updateCommercialServiceForecasts(serviceName as string)) // sums up the forecasts and creates new records
            return status.join('\r\n')
        })

        // Received from ManagedAlerts service to test an alert configuration
        this.on(testAlert, async req => {
            const { ID } = req.data
            const data = await fetchMeasuresForAlerts(ID as UUID)
            return data.reduce((p, c): string => {
                const { alert, measures } = c
                p += createAlertsTableCourierNew(alert, measures)
                return p
            }, '')
        })

        return super.init()
    }
}


/**
 * Download the usage/cost data, aggregate it per level and create Service, Metric, Measure and ForecastSetting records in the database
 * @param query `fromDate` and `toDate` to query the source for
 * @param interval `Daily` or `Monthly` readings
 * @returns string
 */
async function retrieveTechnicalData(query: { fromDate: number, toDate: number }, interval: TInterval) {
    info(`Getting ${interval} technical data from ${query.fromDate} till ${query.toDate} ...`)

    const usageData = await api_monthlyUsage(query)
    const data = (usageData.content as MonthlyUsageResponseObject[])
    // const [usageData, data] = [{ content: [] }, usage_data]

    // add default values if property is null
    data.forEach(x => {
        x.serviceName ??= Settings.defaultValues.noNameErrorValue
        x.metricName ??= Settings.defaultValues.noNameErrorValue
    })

    const { services, metrics, measures } = aggregateDataPerLevel(data, interval, ['usage'], ['spaceName', 'environmentInstanceName', 'application', 'instanceId'])

    // Store in database
    services.length > 0 && await UPSERT.into(BTPServices).entries(services)
    metrics.length > 0 && await UPSERT.into(TechnicalMetrics).entries(metrics)
    measures.length > 0 && await UPSERT.into(TechnicalMeasures).entries(measures)

    const status = `${metrics.length} usage metrics added to the database from ${usageData.content.length} raw entries.`
    info(status)
    return status
}
async function retrieveCommercialData(query: { fromDate: number, toDate: number }, interval: TInterval) {
    info(`Getting ${interval} commercial data from ${query.fromDate} till ${query.toDate} ...`)

    const usageData = await api_monthlyCost(query)
    const data = (usageData.content as MonthlyCostResponseObject[])
    // const [usageData, data] = [{ content: [] }, cost_data]

    // add default values if property is null
    data.forEach(x => {
        x.serviceName ??= Settings.defaultValues.noNameErrorValue
        x.metricName ??= Settings.defaultValues.noNameErrorValue
    })

    const { services, metrics, measures } = aggregateDataPerLevel(data, interval, ['cost', 'usage', 'actualUsage', 'chargedBlocks'], [])

    // Create the dataset of new services that need to be added to the forecast settings table
    const existingForecastSettings = (await SELECT.from(ForecastSettings).columns('serviceName', 'metricName')).map(x => `${x.serviceName}__${x.metricName}`)
    const forecastSettings = [
        ...new Set(
            metrics.filter(x => x.metricName !== '_combined_')
                .map(x => `${x.toService_serviceName}__${x.metricName}`)
                .filter(x => !existingForecastSettings.includes(x))
        )
    ].map(x => {
        const [serviceName, metricName] = x.split('__')
        return {
            serviceName,
            metricName,
            ...Settings.defaultValues.forecastSetting
        }
    })

    // Store in database
    services.length > 0 && await UPSERT.into(BTPServices).entries(services)
    metrics.length > 0 && await UPSERT.into(CommercialMetrics).entries(metrics)
    measures.length > 0 && await UPSERT.into(CommercialMeasures).entries(measures)
    forecastSettings.length > 0 && await INSERT.into(ForecastSettings).entries(forecastSettings)

    const status = `${metrics.length} cost metrics added to the database from ${usageData.content.length} raw entries.`
    info(status)
    return status
}


/**
 * 
 * @param data API input
 * @param interval 
 * @param measureAggregationProperties 
 * @param tagAggregationProperties 
 * @returns 
 */
function aggregateDataPerLevel(data: MonthlyCostResponseObject[] | MonthlyUsageResponseObject[], interval: TInterval, measureAggregationProperties: string[], tagAggregationProperties: string[]) {
    let services: BTPServices = []
    let metrics: CommercialMetrics | TechnicalMetrics = []
    let measures: CommercialMeasures | TechnicalMeasures = []

    // Aggregate on initial level: per Service
    for (const serviceGroup of Object.values(groupByKeys(data, ['serviceName', 'reportYearMonth']))) {
        const service: BTPService = {
            reportYearMonth: serviceGroup[0].reportYearMonth.toString(),
            serviceName: serviceGroup[0].serviceName,
            retrieved: interval == TInterval.Daily ? dateToISODate() as CdsDate : lastDayOfMonth(serviceGroup[0].reportYearMonth.toString()),
            interval: interval
        }
        services.push(service)

        const metric = {
            toService: service,
            metricName: '_combined_'
        }
        metrics.push(metric)

        measures = [
            ...measures,
            ...aggregateMeasures(metric, groupByKeys(serviceGroup, ['globalAccountName']), 'GlobalAccount', measureAggregationProperties),
            ...aggregateMeasures(metric, groupByKeys(serviceGroup, ['dataCenterName']), 'Datacenter', measureAggregationProperties),
            ...aggregateMeasures(metric, groupByKeys(serviceGroup, ['directoryName']), 'Directory', measureAggregationProperties),
            ...aggregateMeasures(metric, groupByKeys(serviceGroup, ['subaccountName']), 'SubAccount', measureAggregationProperties)
        ]

        // Aggregate one additional level: per Metric
        for (const metricGroup of Object.values(groupByKeys(serviceGroup, ['metricName']))) {
            const metric = {
                toService: service,
                metricName: metricGroup[0].metricName
            }
            metrics.push({
                ...metric,
                tags: aggregateTags(metricGroup, tagAggregationProperties)
            })

            measures = [
                ...measures,
                ...aggregateMeasures(metric, groupByKeys(metricGroup, ['globalAccountName']), 'GlobalAccount', measureAggregationProperties),
                ...aggregateMeasures(metric, groupByKeys(metricGroup, ['dataCenterName']), 'Datacenter', measureAggregationProperties),
                ...aggregateMeasures(metric, groupByKeys(metricGroup, ['directoryName']), 'Directory', measureAggregationProperties),
                ...aggregateMeasures(metric, groupByKeys(metricGroup, ['subaccountName']), 'SubAccount', measureAggregationProperties)
            ]
        }
    }
    metrics = metrics.map(x => flattenObject(x))
    measures = measures.map(x => flattenObject(x))

    return { services, metrics, measures }
}

/**
 * Aggregates the measures for a given metric
 * @param metric metric that the measures belong to
 * @param measureGroups grouped set of measures that below to the same Service / Metric that need to be aggregated
 * @param level level of aggregation, e.g. GlobalAccount, Directory, ...
 * @param aggregationProperties properties of the measure that need to be summed up
 * @returns Set of measures
 */
function aggregateMeasures(metric: Record<string, any>, measureGroups: { [key: string]: Record<string, any>[] }, level: TAggregationLevel, aggregationProperties: string[]) {
    const aggregatedMeasures: Record<string, any>[] = []
    for (const [name, measures] of Object.entries(measureGroups)) {

        // Sum up the mentioned properties over all measures
        const sums = measures.reduce((p, c) => {
            aggregationProperties.forEach(k => p[k] = (p[k] ?? 0) + c[k])
            return p
        }, {})

        // Verify if this is commercial data. We only need/have forecasts for commercial data
        const isCommercial = measures[0].hasOwnProperty('currency')

        // Create record for database update
        aggregatedMeasures.push({
            toMetric: metric,
            level: level,
            name: name,
            measure: sums,
            unit: measures[0].unitPlural,
            ...(isCommercial) && { currency: measures[0].currency },
            ...(isCommercial && (metric.toService.interval == TInterval.Monthly)) && { forecast: sums, forecastPct: 100 } // monthly readings default to 100% forecast
        })
    }

    return aggregatedMeasures
}
function aggregateTags(items: MonthlyCostResponseObject[] | MonthlyUsageResponseObject[], tags: string[]) {
    const aggregated = []
    for (const name of tags) {
        //@ts-ignore
        const values = [...new Set(items.map(x => x[name]))]
            .filter(x => x != '' && x != null)
            .sort()
        values.length > 0 && aggregated.push({ name, values })
    }
    return aggregated
}

/**
 * Calculates the forecasted values for the daily measurements
 * @param serviceName optional name of the service to restrict the update only to that service
 * @returns string
 */
async function updateCommercialMetricForecasts(serviceName?: string) {
    info(`Updating forecast data ...`)

    let forecasted: CommercialMeasures = []
    const measures = await SELECT.from(prepareCommercialMeasureMetricForecasts).where(serviceName && { serviceName: serviceName })
    for (const measure of measures) {

        // Calculate how far in the month we are
        const retrievedDay = Number(measure.retrieved?.split('-')[2])
        const retrievedYearMonth = dateToYearMonth(new Date(measure.retrieved ?? 0))
        const howFarInMonthPct = (measure.reportYearMonth == retrievedYearMonth) ? Math.min(retrievedDay / 30, 1) : 1

        // Set multiplier based on Forecast Method
        let multiplier = 1
        if (measure.method == TForecastMethod.TimeLinear) multiplier = 1 / howFarInMonthPct
        else if (measure.method == TForecastMethod.TimeDegressive) multiplier = 1 / (howFarInMonthPct ** (measure.degressionFactor ?? 1))

        // Default values
        let forecastPct = 100
        let forecast: TCommercialMeasure = {
            cost: measure.measure_cost,
            usage: measure.measure_usage,
            actualUsage: measure.measure_actualUsage,
            chargedBlocks: measure.measure_chargedBlocks
        }

        // Calculate values if not excluded
        if (measure.method !== TForecastMethod.Excluded) {
            forecastPct = (measure.max_cost && measure.max_cost > 0) ? ((measure.measure_cost ?? 0) * multiplier * 100 / measure.max_cost) : 100
            forecast = {
                cost: fixDecimals((measure.measure_cost ?? 0) * multiplier),
                usage: fixDecimals((measure.measure_usage ?? 0) * multiplier),
                actualUsage: fixDecimals((measure.measure_actualUsage ?? 0) * multiplier),
                chargedBlocks: fixDecimals((measure.measure_chargedBlocks ?? 0) * multiplier)
            }
        }

        // Create record for database update
        forecasted.push({
            toMetric: {
                toService: {
                    reportYearMonth: measure.reportYearMonth,
                    serviceName: measure.serviceName,
                    retrieved: measure.retrieved,
                    interval: measure.interval
                },
                metricName: measure.metricName,
            },
            level: measure.level,
            name: measure.name,
            ... (measure.metricName !== '_combined_') && { forecast },
            forecastPct: fixDecimals(forecastPct, 0),
            max_cost: measure.max_cost
        })
    }
    forecasted = forecasted.map(x => flattenObject(x))

    forecasted.length > 0 && await UPSERT.into(CommercialMeasures).entries(forecasted)

    const status = `${forecasted.length} forecasts updated in the database.`
    info(status)
    return status
}
/**
 * Calculates the forecasted values for the daily measurements, aggregated on service level
 * @param serviceName optional name of the service to restrict the update only to that service
 * @returns string
 */
async function updateCommercialServiceForecasts(serviceName?: string) {
    info(`Updating commercial sum by level data ...`)

    let status = ''
    if (cds.env.requires.db.kind == 'hana') {
        // Use single SQL query that can be executed in HANA (faster)
        const where = serviceName ? ` WHERE (toMetric_toService_serviceName = '${serviceName}')` : ''
        const sql = `UPSERT ${CommercialMeasures.name.replace('.', '_')} SELECT * FROM ${prepareCommercialMeasureServiceForecasts.name.replace('.', '_')}${where}`
        const rows = await db.run(sql)
        status = `${rows} data points updated in the database (optimized).`
    } else {
        // Fallback approach which routes the data via the application layer (slower)
        const data = await SELECT.from(prepareCommercialMeasureServiceForecasts).where(serviceName && { toMetric_toService_serviceName: serviceName })
        data.length > 0 && await UPSERT.into(CommercialMeasures).entries(data)
        status = `${data.length} data points updated in the database.`
    }

    info(status)
    return status
}


async function sendNotification() {
    info(`Sending alerts ...`)

    const data = await fetchMeasuresForAlerts()
    const alertBody = data.reduce((p, c): string => {
        const { alert, measures } = c
        if (measures.length > 0) p += createAlertsTableCourierNew(alert, measures)
        return p
    }, '')

    alertBody.length > 0 && await api_sendNotification({
        ...Settings.defaultValues.notification,
        body: alertBody
    })
    const status = alertBody.length > 0 ? `Alerts sent to notification service.` : `No Alerts triggered.`

    info(status)
    return status
}
/**
 * Call the Alert Notification API to send event
 * @param event 
 * @returns generated event
 */
function api_sendNotification(event: CustomerResourceEvent) {
    return ResourceEventsApi
        .postResourceEvent(event)
        .skipCsrfTokenFetching()
        .execute({ destinationName: 'btprc-notif' })
}

async function fetchMeasuresForAlerts(alertID?: UUID): Promise<{ alert: Alert; measures: any[] }[]> {
    //@ts-expect-error
    let alerts = await SELECT.from(Alerts).columns(a => { a('*'), a.thresholds('*') })
    if (alertID) {
        alerts = alerts.filter(x => x.ID == alertID)
    } else {
        alerts = alerts.filter(x => x.active)
    }

    const result: { alert: Alert, measures: any[] }[] = []
    for (const alert of alerts) {
        const whereClause: CommercialMeasure = {
            // Add static filters
            toMetric_toService_retrieved: dateToISODate(),

            // Add filters for included/excluded levels by name
            level: alert.levelScope,
            ...(alert.levelItems && alert.levelItems.length > 0) && {
                name: (alert.levelMode == TInExclude.Include)
                    ? { 'in': alert.levelItems }
                    : { 'not in': alert.levelItems }
            },

            // Add filters for included/excluded Services/Metrics
            ...alert.serviceScope == TServiceScopes.Service
                ? {
                    ...(alert.serviceItems && alert.serviceItems.length > 0) && {
                        toMetric_toService_serviceName: (alert.serviceMode == TInExclude.Include)
                            ? { 'in': alert.serviceItems }
                            : { 'not in': alert.serviceItems }
                    },
                    toMetric_metricName: '_combined_'
                }
                : {
                    toMetric_metricName: (alert.serviceMode == TInExclude.Include && alert.serviceItems && alert.serviceItems.length > 0)
                        ? { 'in': alert.serviceItems }
                        : { 'not in': [...(alert.serviceItems && alert.serviceItems.length > 0 ? alert.serviceItems : []), '_combined_'] }
                },

            // Add filters for dynamic thresholds
            ...alert.thresholds?.reduce((p: any, c: any) => {
                p[c.property] = { [c.operator]: c.amount }
                return p
            }, {})
        }
        const measures = await SELECT.from(
            alert.alertType == TAlertType.Commercial
                ? CommercialMeasures
                : TechnicalMeasures
        )
            .where(whereClause)
            .orderBy('toMetric_toService_serviceName', 'toMetric_metricName')

        measures.forEach(m => m.toMetric_metricName = m.toMetric_metricName == '_combined_' ? 'Multiple' : m.toMetric_metricName)
        result.push({
            alert: alert as Alert,
            measures
        })
    }

    return result
}
function createAlertsTableHTML(alert: Alert, measures: CommercialMeasures | TechnicalMeasures): string {
    let rows: string[] = []
    if (alert.alertType == TAlertType.Commercial) {
        rows = [
            // Table header
            ['Service', 'Metric', 'Cost', 'Forecast', 'Currency']
                .map(x => `<th>${x}</th>`)
                .join(),

            // Table rows
            ...(measures.length > 0
                ? measures.map(item =>
                    //@ts-expect-error
                    [item.toService_serviceName, item.metricName, item.measure_cost, item.forecast_cost, item.currency]
                        .map(x => `<td>${x}</td>`)
                        .join()
                )
                : ['<td>No alerts.</td>']
            )
        ].map(x => `<tr>${x}</tr>`)
    } else {
        rows = [
            // Table header
            ['Service', 'Metric', 'Usage', 'Unit']
                .map(x => `<th>${x}</th>`)
                .join(),

            // Table rows
            ...(measures.length > 0
                ? measures.map(item =>
                    //@ts-expect-error
                    [item.toService_serviceName, item.metricName, item.measure_usage, item.unit]
                        .map(x => `<td>${x}</td>`)
                        .join()
                )
                : ['<td>No alerts.</td>']
            )
        ].map(x => `<tr>${x}</tr>`)
    }
    return `<h2>${alert.name}</h2>
    <table>${rows.join('\r\n')}</table>`
}
function createAlertsTableCourierNew(alert: Alert, measures: CommercialMeasures | TechnicalMeasures): string {
    const columns: alertTableColumn[] = alert.alertType == TAlertType.Commercial
        ? Settings.alertTableColumns.Commercial
        : Settings.alertTableColumns.Technical

    const name = `## ${alert.name}`
    const header = `| ${columns.map(c => setColumnWidth(c.title, c)).join(` | `)} |`
    const line = `|${columns.map(c => '-'.repeat(c.width + 2)).join(`|`)}|`
    const rows = measures.map(m => {
        //@ts-ignore
        const line = columns.map(c => setColumnWidth(m[c.value].toString(), c))
        return `| ${line.join(` | `)} | `
    })

    return `${name}\r\n\r\n${header}\r\n${line}\r\n${rows.join('\r\n')}\r\n\r\n\r\n`
}
function setColumnWidth(value: string, settings: alertTableColumn) {
    return settings.padStart
        ? value.slice(0, settings.width).padStart(settings.width)
        : value.slice(0, settings.width).padEnd(settings.width)
}
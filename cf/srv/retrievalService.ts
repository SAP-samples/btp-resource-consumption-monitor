import cds, { db } from '@sap/cds'
import { Settings } from './settings'
import {
    dateToYearMonth,
    fixDecimals,
    dateToISODate,
    groupByKeys,
    flattenObject,
    lastDayOfMonth,
    getPreviousMonth,
    stringToCdsDate,
    getDaysInMonth,
    getNextMonth,
    getServiceDestination
} from './functions'

import {
    api_monthlyUsage,
    api_monthlyCost,
    api_creditDetails
} from './api_uasReporting'

import {
    MonthlyCostResponseObject,
    MonthlyUsageResponseObject,
    ContractResponseObject,
    PhaseUpdates,
    PhasesResponseObject
} from './external/APIUasReportingService'

import {
    ResourceEventsApi,
    CustomerResourceEvent
} from './external/APIAlertNotificationService'

import {
    TAccountStructureLevels,
    TAggregationLevel,
    TAlertType,
    TCreditStatus,
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

    AccountStructureItems as dbAccountStructureItems,
    ContractCreditValue,
    CloudCreditsDetailsResponseObjects,
    CustomTags,
    ManagedTagAllocations,
} from '#cds-models/db'

import {
    TCommercialMeasure,
    TTechnicalMeasure
} from '#cds-models/api'

import {
    downloadMeasuresForToday,
    downloadMeasuresForPastMonths,
    deleteAllData,
    deleteStructureAndTagData,
    resetForecastSettings,
    calculateCommercialForecasts,
    prepareCommercialMeasureMetricForecasts,
    prepareCommercialMeasureServiceForecasts,
    calculateCommercialForecastsForService,
    testAlert,
    AccountStructureItems,
    CloudCreditsDetails,
    prepareTechnicalAllocations,
    AllocationSettings,
    resetTechnicalAllocations,
} from '#cds-models/RetrievalService'

import {
    Alerts as AlertsView
} from '#cds-models/ManageAlertsService'

import { CdsDate } from '#cds-models/_'

const { info, warn } = cds.log('retrievalService')

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
            const thisMonth = Number(dateToYearMonth())

            await cds.tx(async () => {
                let status = ['Data Retrieval:']
                try {
                    status.push(await retrieveTechnicalData({ fromDate: thisMonth, toDate: thisMonth }, TInterval.Daily))
                    status.push(await retrieveCommercialData({ fromDate: thisMonth, toDate: thisMonth }, TInterval.Daily))
                    req.notify(status.join('\r\n'))
                } catch (e) { warn(String(e)); status.push(String(e)); req.warn(400, status.join('\r\n')) }
            })
            await cds.tx(async () => {
                let status = ['Forecast Calculations:']
                try {
                    status.push(await updateCommercialMetricForecasts())
                    status.push(await updateCommercialServiceForecasts())
                    req.notify(status.join('\r\n'))
                } catch (e) { warn(String(e)); status.push(String(e)); req.warn(400, status.join('\r\n')) }
            })
            await cds.tx(async () => {
                let status = ['Delta Calculations:']
                try {
                    status.push(await updateDailyDeltaMeasures())
                    status.push(await updateMonthlyDeltaMeasures())
                    req.notify(status.join('\r\n'))
                } catch (e) { warn(String(e)); status.push(String(e)); req.warn(400, status.join('\r\n')) }
            })
            await cds.tx(async () => {
                let status = ['Contract Information:']
                try {
                    status.push(await retrieveCreditDetails())
                    req.notify(status.join('\r\n'))
                } catch (e) { warn(String(e)); status.push(String(e)); req.warn(400, status.join('\r\n')) }
            })
            await cds.tx(async () => {
                let status = ['Alert Notifications:']
                try {
                    status.push(await sendNotification())
                    req.notify(status.join('\r\n'))
                } catch (e) { warn(String(e)); status.push(String(e)); req.warn(400, status.join('\r\n')) }
            })

            return req.messages
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
            const pastMonth = getPreviousMonth()

            await cds.tx(async () => {
                let status = ['Data Retrieval:']
                try {
                    status.push(await retrieveTechnicalData({ fromDate: req.data.fromDate || pastMonth, toDate: pastMonth }, TInterval.Monthly))
                    status.push(await retrieveCommercialData({ fromDate: req.data.fromDate || pastMonth, toDate: pastMonth }, TInterval.Monthly))
                    req.notify(status.join('\r\n'))
                } catch (e) { warn(String(e)); status.push(String(e)); req.warn(400, status.join('\r\n')) }
            })
            await cds.tx(async () => {
                let status = ['Forecast Calculations:']
                try {
                    status.push(await updateCommercialMetricForecasts())
                    status.push(await updateCommercialServiceForecasts())
                    req.notify(status.join('\r\n'))
                } catch (e) { warn(String(e)); status.push(String(e)); req.warn(400, status.join('\r\n')) }
            })
            await cds.tx(async () => {
                let status = ['Delta Calculations:']
                try {
                    status.push(await updateDailyDeltaMeasures())
                    status.push(await updateMonthlyDeltaMeasures())
                    req.notify(status.join('\r\n'))
                } catch (e) { warn(String(e)); status.push(String(e)); req.warn(400, status.join('\r\n')) }
            })

            return req.messages
        })

        /**
         * This function removes ALL usage data from the database
         */
        this.on(deleteAllData, async req => {
            await DELETE.from(BTPServices)
            await DELETE.from(CloudCreditsDetailsResponseObjects)
            return `All consumption data has been removed from the database.`
        })

        this.on(deleteStructureAndTagData, async req => {
            await DELETE.from(CustomTags)
            await DELETE.from(ManagedTagAllocations)
            await DELETE.from(dbAccountStructureItems)
            return `All account structure data and tags have been removed from the database.`
        })

        this.on(resetTechnicalAllocations, async req => {
            await DELETE.from(AllocationSettings)
            return `All technical allocations have been reset.`
        })

        /**
         * This function resets all Forecast Settings back to the default setting
         */
        this.on(resetForecastSettings, async req => {
            let status = []

            await db.run(`DELETE FROM ${ForecastSettings.name.replace('.', '_')} AS f WHERE NOT EXISTS (
                SELECT DISTINCT toservice_serviceID, measureId FROM ${CommercialMetrics.name.replace('.', '_')} AS c
	            WHERE c.toService_serviceID = f.serviceId AND c.measureId = f.measureId)`)

            const forecastSetting = {
                ...Settings.defaultValues.forecastSetting
            } as ForecastSetting
            await UPDATE(ForecastSettings).with(forecastSetting)
            status.push(`All forecast settings have been reverted to ${forecastSetting.method}, factor ${forecastSetting.degressionFactor}.`)

            status.push(await updateCommercialMetricForecasts())
            status.push(await updateCommercialServiceForecasts())

            return status.join('\r\n')
        })

        // Received from Presentation Service when a metric has its Forecast Settings changed, or 'recalculate all' is clicked
        this.on(calculateCommercialForecasts, async req => {
            let status = []
            status.push(await updateCommercialMetricForecasts())
            status.push(await updateCommercialServiceForecasts())
            status.push(await updateDailyDeltaMeasures())
            status.push(await updateMonthlyDeltaMeasures())
            return status.join('\r\n')
        })

        // Received from Presentation Service when a metric has its Forecast Settings changed, or a commercial item is deleted
        this.on(calculateCommercialForecastsForService, async req => {
            let status = []
            const { serviceId } = req.data
            status.push(await updateCommercialMetricForecasts(serviceId as string)) // calcalates forecasts
            status.push(await updateCommercialServiceForecasts(serviceId as string)) // sums up the forecasts and creates new records
            status.push(await updateDailyDeltaMeasures())
            status.push(await updateMonthlyDeltaMeasures())
            return status.join('\r\n')
        })

        // Received from ManagedAlerts service to test an alert configuration
        this.on(testAlert, async req => {
            const { ID, isDraft } = req.data
            const alert = await SELECT.from(isDraft ? AlertsView.drafts : AlertsView, ID ?? '').columns(a => {
                a('*'),
                    a.thresholds('*'),
                    a.serviceItems('*'),
                    a.levelItems('*')
            }) as Alert
            if (alert) {
                const request = buildRequestForAlert(alert)
                let table = ''
                let measures: any[] = []
                try {
                    measures = await request.req
                    measures.forEach(m => {
                        m.metricName = m.toMetric_measureId == '_combined_' ? 'Multiple' : (m.toMetric_measureId || m.metricName)
                        m.serviceName = m.toMetric_toService_serviceName || m.toMetric_toService_serviceName
                    })
                    table = createAlertsTableCourierNew(alert, measures)
                } catch (error) {
                    warn(error)
                    table = String(error)
                }
                return {
                    table,
                    json: JSON.stringify(request.json),
                    sql: request.sql
                }
            }
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

    sanitizeDataPoints(data)
    await updateAccountStructureData(data)
    const { services, metrics, measures } = await aggregateDataPerLevel(data, interval, ['usage'], ['spaceId', 'spaceName', 'environmentInstanceName', 'application', 'instanceId'])

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

    sanitizeDataPoints(data)
    applyCurrencyConversion(data, 'currency', ['cost', 'paygCost', 'cloudCreditsCost'])
    await updateAccountStructureData(data)
    const { services, metrics, measures } = await aggregateDataPerLevel(data, interval, ['cost', 'usage', 'actualUsage', 'chargedBlocks', 'paygCost', 'cloudCreditsCost'], [])

    // Create the dataset of new services that need to be added to the forecast settings table
    const existingForecastSettings = (await SELECT.from(ForecastSettings).columns('serviceId', 'measureId')).map(x => `${x.serviceId}__${x.measureId}`)
    const forecastSettings = [
        ...new Set(
            metrics.filter(x => x.measureId !== '_combined_')
                .map(x => `${x.toService_serviceId}__${x.measureId}`)
                .filter(x => !existingForecastSettings.includes(x))
        )
    ].map(x => {
        const [serviceId, measureId] = x.split('__')
        return {
            serviceId,
            measureId,
            ...Settings.defaultValues.forecastSetting
        }
    }) as ForecastSettings

    // Store in database
    services.length > 0 && await UPSERT.into(BTPServices).entries(services)
    metrics.length > 0 && await UPSERT.into(CommercialMetrics).entries(metrics)
    measures.length > 0 && await UPSERT.into(CommercialMeasures).entries(measures)
    forecastSettings.length > 0 && await INSERT.into(ForecastSettings).entries(forecastSettings)

    const status = `${metrics.length} cost metrics added to the database from ${usageData.content.length} raw entries.`
    info(status)
    return status
}

function sanitizeDataPoints(data: MonthlyUsageResponseObject[] | MonthlyCostResponseObject[]): void {
    data.forEach(x => {
        // Harmonize the serviceId and measureId as commercial and technical usage might have different cases.
        x.serviceId = x.serviceId?.toLowerCase()
        x.measureId = x.measureId?.toLowerCase()
        // Add error values for fields that should not be empty
        x.serviceId ??= Settings.defaultValues.noNameErrorValue
        x.serviceName ??= Settings.defaultValues.noNameErrorValue
        x.measureId ??= Settings.defaultValues.noNameErrorValue
        x.metricName ??= Settings.defaultValues.noNameErrorValue
        // Fix empty values if services are outside a sub account (these would be: process-automation, IAS, IPS, custom domain, market-rates and IRPA)
        if (x.subaccountId == null || x.subaccountId == '' || x.subaccountId.toUpperCase() == 'DEFAULT_SA') {
            x.subaccountId = `unallocatedSA_${x.globalAccountId}`
            x.subaccountName = 'Unallocated'
        }
        // Add placeholder values if there is no value
        if (x.dataCenter == null || x.dataCenter == '') {
            x.dataCenter = `unallocatedDC`
            x.dataCenterName = 'Unallocated'
        }
        // Make Datacenter ID unique per Global Account
        x.dataCenter += `_${x.globalAccountId}`

        // Make sure the new API fields are available if not yet in response body
        if ('cost' in x) {
            if (!('paygCost' in x)) x.paygCost = 0
            if (!('cloudCreditsCost' in x)) x.cloudCreditsCost = x.cost
        }
    })
}

function applyCurrencyConversion<T>(data: T[], currencyField: keyof T, conversionFields: (keyof T)[]): void {
    const { active, target } = Settings.appConfiguration.currencyConversions
    const rates: { [key: string]: number } = Settings.appConfiguration.currencyConversions.rates

    active && data.forEach(x => {
        const currency = (x[currencyField] as string ?? '').toUpperCase()
        if (target !== currency && currency in rates) {
            conversionFields.forEach(field => {
                x[field] = x[field] ? (x[field] as number * rates[currency]) as any : null
            })
            x[currencyField] = target as any
        }
    })
}

/**
 * 
 * @param data API input
 * @param interval 
 * @param measureAggregationProperties 
 * @param tagAggregationProperties 
 * @returns 
 */
async function aggregateDataPerLevel(data: MonthlyCostResponseObject[] | MonthlyUsageResponseObject[], interval: TInterval, measureAggregationProperties: string[], tagAggregationProperties: string[]) {
    let services: BTPServices = []
    let metrics: CommercialMetrics | TechnicalMetrics = []
    let measures: CommercialMeasures | TechnicalMeasures = []

    // Fetch technical allocations for commercial metrics
    const technicalAllocationTable = await SELECT.from(prepareTechnicalAllocations)

    // Aggregate on initial level: per Service
    for (const serviceGroup of Object.values(groupByKeys(data, ['serviceId', 'reportYearMonth']))) {
        const service: BTPService = {
            reportYearMonth: serviceGroup[0].reportYearMonth.toString(),
            serviceId: serviceGroup[0].serviceId,
            serviceName: serviceGroup[0].serviceName,
            retrieved: interval == TInterval.Daily ? dateToISODate() as CdsDate : lastDayOfMonth(serviceGroup[0].reportYearMonth.toString()),
            interval: interval
        }
        services.push(service)

        const metric = {
            toService: {
                reportYearMonth: service.reportYearMonth,
                serviceId: service.serviceId,
                retrieved: service.retrieved,
                interval: service.interval
            },
            measureId: '_combined_'
        }
        metrics.push(metric)

        // Create unique IDs depending on the parent
        const serviceGroupByParent = serviceGroup
            //@ts-ignore
            .map(x => ({ ...x, groupId: `${x.spaceId || x.subaccountId}_${x.serviceId}` }) as MonthlyUsageResponseObject & { groupId: string })
        const serviceGroupForInstancesByParent = serviceGroup
            .filter(x => Settings.appConfiguration.serviceInstancesCreationList.includes(x.serviceId))
            //@ts-ignore
            .map(x => ({ ...x, groupId: `${x.subaccountId}_${x.serviceId}_${x.instanceId}` }) as MonthlyUsageResponseObject & { groupId: string })
        const serviceGroupForApplicationsByParent = serviceGroup
            .filter(x => Settings.appConfiguration.serviceInstanceApplicationsCreationList.includes(x.serviceId))
            //@ts-ignore
            .map(x => ({ ...x, groupId: `${x.subaccountId}_${x.serviceId}_${x.instanceId}_${x.application}` }) as MonthlyUsageResponseObject & { groupId: string })

        const isCommercial = 'currency' in serviceGroup[0]
        measures = [
            ...measures,
            ...aggregateMeasures(metric, Object.fromEntries([[JSON.stringify(Settings.appConfiguration.accountHierarchy.master), serviceGroup]]), TAggregationLevel.Customer, measureAggregationProperties),
            ...aggregateMeasures(metric, groupByKeys(serviceGroup, ['globalAccountId', 'globalAccountName']), TAggregationLevel.GlobalAccount, measureAggregationProperties),
            ...aggregateMeasures(metric, groupByKeys(serviceGroup, ['dataCenter', 'dataCenterName']), TAggregationLevel.Datacenter, measureAggregationProperties),
            ...aggregateMeasures(metric, groupByKeys(serviceGroup, ['directoryId', 'directoryName']), TAggregationLevel.Directory, measureAggregationProperties),
            ...aggregateMeasures(metric, groupByKeys(serviceGroup, ['subaccountId', 'subaccountName']), TAggregationLevel.SubAccount, measureAggregationProperties),
            //@ts-ignore
            ...(!isCommercial ? aggregateMeasures(metric, groupByKeys(serviceGroup, ['spaceId', 'spaceName']), TAggregationLevel.Space, measureAggregationProperties) : []),
            // Create Service records
            ...aggregateMeasures(metric, groupByKeys(serviceGroupByParent, ['groupId', 'serviceName']), TAggregationLevel.ServiceInSubaccount, measureAggregationProperties),
            // Create Service Instances
            //@ts-ignore
            ...(!isCommercial ? aggregateMeasures(metric, groupByKeys(serviceGroupForInstancesByParent, ['groupId', 'instanceId']), TAggregationLevel.InstanceOfService, measureAggregationProperties) : []),
            // Create Applications in Service 
            //@ts-ignore
            ...(!isCommercial ? aggregateMeasures(metric, groupByKeys(serviceGroupForApplicationsByParent, ['groupId', 'application']), TAggregationLevel.ApplicationInService, measureAggregationProperties) : [])
        ]

        // Aggregate one additional level: per Metric
        for (const metricGroup of Object.values(groupByKeys(serviceGroup, ['measureId']))) {
            const metric = {
                toService: {
                    reportYearMonth: service.reportYearMonth,
                    serviceId: service.serviceId,
                    retrieved: service.retrieved,
                    interval: service.interval
                },
                measureId: metricGroup[0].measureId,
                metricName: metricGroup[0].metricName
            }
            metrics.push({
                ...metric,
                tags: aggregateTags(metricGroup, tagAggregationProperties)
            })

            // Create unique IDs depending on the parent, only applicable for technical items
            const metricGroupByParent = metricGroup
                //@ts-ignore
                .map(x => ({ ...x, groupId: `${x.spaceId || x.subaccountId}_${x.serviceId}` }) as MonthlyUsageResponseObject & { groupId: string })
            const metricGroupForInstancesByParent = metricGroup
                .filter(x => Settings.appConfiguration.serviceInstancesCreationList.includes(x.serviceId))
                //@ts-ignore
                .map(x => ({ ...x, groupId: `${x.subaccountId}_${x.serviceId}_${x.instanceId}` }) as MonthlyUsageResponseObject & { groupId: string })
            const metricGroupForApplicationsByParent = metricGroup
                .filter(x => Settings.appConfiguration.serviceInstanceApplicationsCreationList.includes(x.serviceId))
                //@ts-ignore
                .map(x => ({ ...x, groupId: `${x.subaccountId}_${x.serviceId}_${x.instanceId}_${x.application}` }) as MonthlyUsageResponseObject & { groupId: string })

            // Temp store for a 2-phased Technical Allocation, first by instance (parent = service), then by application (parent = instance)
            let tamServiceInstances: Record<string, any>[] = []

            const isCommercial = 'currency' in metricGroup[0]
            measures = [
                ...measures,
                ...aggregateMeasures(metric, Object.fromEntries([[JSON.stringify(Settings.appConfiguration.accountHierarchy.master), metricGroup]]), TAggregationLevel.Customer, measureAggregationProperties),
                ...aggregateMeasures(metric, groupByKeys(metricGroup, ['globalAccountId', 'globalAccountName']), TAggregationLevel.GlobalAccount, measureAggregationProperties),
                ...aggregateMeasures(metric, groupByKeys(metricGroup, ['dataCenter', 'dataCenterName']), TAggregationLevel.Datacenter, measureAggregationProperties),
                ...aggregateMeasures(metric, groupByKeys(metricGroup, ['directoryId', 'directoryName']), TAggregationLevel.Directory, measureAggregationProperties),
                ...aggregateMeasures(metric, groupByKeys(metricGroup, ['subaccountId', 'subaccountName']), TAggregationLevel.SubAccount, measureAggregationProperties),
                //@ts-ignore
                ...(!isCommercial ? aggregateMeasures(metric, groupByKeys(metricGroup, ['spaceId', 'spaceName']), TAggregationLevel.Space, measureAggregationProperties) : []),
                // Create Service records
                ...aggregateMeasures(metric, groupByKeys(metricGroupByParent, ['groupId', 'serviceName']), TAggregationLevel.ServiceInSubaccount, measureAggregationProperties),
                // Create Service Instances
                //@ts-ignore
                ...(!isCommercial ? aggregateMeasures(metric, groupByKeys(metricGroupForInstancesByParent, ['groupId', 'instanceId']), TAggregationLevel.InstanceOfService, measureAggregationProperties) : []),
                // Create Applications in Service
                ...(!isCommercial ? aggregateMeasures(metric, groupByKeys(metricGroupForApplicationsByParent, ['groupId', 'application']), TAggregationLevel.ApplicationInService, measureAggregationProperties) : []),
                ...((isCommercial && Settings.appConfiguration.distributeCostsToSpaces)
                    ? generateTechnicalAllocationMeasures(metric, technicalAllocationTable, TAggregationLevel.Space, aggregateMeasures(metric, groupByKeys(metricGroup, ['subaccountId', 'subaccountName']), TAggregationLevel.SubAccount, measureAggregationProperties))
                    : []
                ),
                ...((isCommercial && Settings.appConfiguration.serviceInstancesCreationList.includes(metric.toService.serviceId!))
                    ? (tamServiceInstances = generateTechnicalAllocationMeasures(metric, technicalAllocationTable, TAggregationLevel.InstanceOfService, aggregateMeasures(metric, groupByKeys(metricGroupByParent, ['groupId', 'serviceName']), TAggregationLevel.ServiceInSubaccount, measureAggregationProperties)))
                    : []
                ),
                ...((isCommercial && Settings.appConfiguration.serviceInstanceApplicationsCreationList.includes(metric.toService.serviceId!))
                    ? generateTechnicalAllocationMeasures(metric, technicalAllocationTable, TAggregationLevel.ApplicationInService, tamServiceInstances)
                    : []
                )
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
    for (const [groupKey, measures] of Object.entries(measureGroups)) {
        const [id, name] = JSON.parse(groupKey)
        if (id == Settings.defaultValues.noNameErrorValue && (level == TAggregationLevel.Space || level == TAggregationLevel.Directory || TAggregationLevel.InstanceOfService)) {
            // Do not generate 'unallocated' entries for Directories (will be in Sub Accounts), Spaces (will belong to higher level) and Service Instances (will belong to higher level)
        } else {
            // Sum up the mentioned properties over all measures
            const sums = measures.reduce((p, c) => {
                aggregationProperties.forEach(k => p[k] = (p[k] ?? 0) + c[k])
                return p
            }, {})
            const planNames = [...new Set(measures.map(x => x.planName))].join(', ')

            // Verify if this is commercial data. We only need/have forecasts for commercial data
            const isCommercial = 'currency' in measures[0]

            // Remove paygCost and cloudCreditsCost from the default 100% forecast values
            const { paygCost, cloudCreditsCost, ...defaultForecastValues } = sums

            // Create record for database update
            aggregatedMeasures.push({
                toMetric: {
                    toService: metric.toService,
                    measureId: metric.measureId
                },
                level: level,
                id: id,
                name: name,
                measure: sums,
                unit: measures[0].unitPlural || measures[0].Unit,
                plans: planNames,
                ...(isCommercial) && { currency: measures[0].currency },
                ...(isCommercial && (metric.toService.interval == TInterval.Monthly)) && { forecast: defaultForecastValues, forecastPct: 100 } // monthly readings default to 100% forecast
            })
        }
    }

    return aggregatedMeasures
}
function aggregateTags(items: MonthlyCostResponseObject[] | MonthlyUsageResponseObject[], tags: string[]) {
    const aggregated = []
    for (const name of tags) {
        //@ts-expect-error
        const values = [...new Set(items.map(x => x[name]))]
            .filter(x => x != '' && x != null)
            .sort()
        values.length > 0 && aggregated.push({ name, values })
    }
    return aggregated
}
function generateTechnicalAllocationMeasures(metric: any, technicalAllocationTable: prepareTechnicalAllocations, aggregationLevel: TAggregationLevel, parentMeasures: Record<string, any>[]) {
    const allocationMeasures: CommercialMeasures | TechnicalMeasures = []

    const allocationForService = technicalAllocationTable.filter(x =>
        x.serviceId == metric.toService.serviceId
        && x.reportYearMonth == metric.toService.reportYearMonth
        && x.retrieved == metric.toService.retrieved
        && x.interval == metric.toService.interval
        && x.cMeasureId == metric.measureId
        && x.level == aggregationLevel
    )

    parentMeasures.forEach(parentMeasure => {
        const allocationForParent = allocationForService.filter(x => x.parentID == parentMeasure.id)
        const totalUsage = allocationForParent.reduce((p, c) => p + Number(c.usage ?? 0), 0)
        allocationForParent.forEach(allocation => {
            const allocationPct = totalUsage > 0 ? (Number(allocation.usage ?? 0) / totalUsage) : 0
            const sums = { ...parentMeasure.measure }
            const { paygCost, cloudCreditsCost, ...defaultForecastValues } = sums
            Object.keys(sums).forEach(k => sums[k] = fixDecimals(Number(sums[k]) * allocationPct))
            // Create Space/Instance record
            allocationMeasures.push({
                toMetric: parentMeasure.toMetric,
                level: aggregationLevel,
                id: allocation.targetID,
                name: allocation.targetName,
                //@ts-expect-error
                measure: sums,
                unit: parentMeasure.unit,
                plans: parentMeasure.plans,
                currency: parentMeasure.currency,
                ...(metric.toService.interval == TInterval.Monthly) && { forecast: defaultForecastValues, forecastPct: 100 } // monthly readings default to 100% forecast
            })
            if (aggregationLevel == TAggregationLevel.Space) {
                // Create Service in Space record
                allocationMeasures.push({
                    toMetric: parentMeasure.toMetric,
                    level: TAggregationLevel.ServiceInSpace,
                    id: `${allocation.targetID}_${allocation.serviceId}`,
                    name: allocation.serviceId, // no serviceName available. Required?
                    //@ts-expect-error
                    measure: sums,
                    unit: parentMeasure.unit,
                    plans: parentMeasure.plans,
                    currency: parentMeasure.currency,
                    ...(metric.toService.interval == TInterval.Monthly) && { forecast: defaultForecastValues, forecastPct: 100 } // monthly readings default to 100% forecast
                })
            }
        })
    })

    return allocationMeasures
}

async function updateAccountStructureData(data: MonthlyUsageResponseObject[]) {
    info(`Updating account structure data ...`)

    const structureItems: dbAccountStructureItems = [];

    // Main Customer record
    structureItems.push({
        ID: Settings.appConfiguration.accountHierarchy.master[0],
        region: 'no region',
        name: Settings.appConfiguration.accountHierarchy.master[1],
        environment: 'none',
        level: TAccountStructureLevels.Customer,
        parentID: null,
        // parentID: '(none)',
        treeLevel: 0,
        treeState: 'expanded',
        managedTagAllocations: [], //Root record should not have tags as that defeats the purpose of tags.
        customTags: []
    });

    // Account records
    [...new Set(data.filter(x => !!x.globalAccountId).map(x => x.globalAccountId))]
        .forEach(id => {
            const item = data.find(x => x.globalAccountId == id)
            item?.globalAccountId && structureItems.push({
                ID: item?.globalAccountId,
                region: item?.dataCenterName,
                name: item?.globalAccountName || item?.globalAccountId,
                environment: (item?.dataCenterName as string)?.split('-')[0].toUpperCase(),
                level: TAccountStructureLevels.GlobalAccount,
                parentID: Settings.appConfiguration.accountHierarchy.master[0],
                treeLevel: 1,
                treeState: 'expanded',
                managedTagAllocations: Settings.tagConfiguration.defaultTagLevel == TAccountStructureLevels.GlobalAccount ? JSON.parse(JSON.stringify(Settings.tagConfiguration.defaultTags)) : [],
                customTags: [{ name: 'Hierarchy', value: `1-${TAccountStructureLevels.GlobalAccount}` }]
            })
        });
    [...new Set(data.filter(x => !!x.directoryId).map(x => x.directoryId))]
        .forEach(id => {
            const item = data.find(x => x.directoryId == id)
            item?.directoryId && structureItems.push({
                ID: item?.directoryId,
                region: item?.dataCenterName,
                name: item?.directoryName || item?.directoryId,
                environment: (item?.dataCenterName as string)?.split('-')[0].toUpperCase(),
                level: TAccountStructureLevels.Directory,
                parentID: item?.globalAccountId,
                treeLevel: 2,
                treeState: 'expanded',
                managedTagAllocations: Settings.tagConfiguration.defaultTagLevel == TAccountStructureLevels.Directory ? JSON.parse(JSON.stringify(Settings.tagConfiguration.defaultTags)) : [],
                customTags: [{ name: 'Hierarchy', value: `2-${TAccountStructureLevels.Directory}` }]
            })
        });
    [...new Set(data.filter(x => !!x.dataCenter).map(x => x.dataCenter))]
        .forEach(id => {
            const item = data.find(x => x.dataCenter == id)
            item?.dataCenter && structureItems.push({
                ID: item?.dataCenter,
                region: item?.dataCenterName,
                name: item?.dataCenterName || item?.dataCenter,
                environment: (item?.dataCenterName as string)?.split('-')[0].toUpperCase(),
                level: TAccountStructureLevels.Datacenter,
                parentID: item?.globalAccountId,
                treeLevel: 2,
                treeState: 'leaf',
                managedTagAllocations: [], //Datacenters are only included to make sure Metrics can link to it and find their parent (GlobalAccount).
                customTags: [{ name: 'Hierarchy', value: `2-${TAccountStructureLevels.Datacenter}` }]
            })
        });
    [...new Set(data.filter(x => !!x.subaccountId).map(x => x.subaccountId))]
        .forEach(id => {
            const item = data.find(x => x.subaccountId == id)
            item?.subaccountId && structureItems.push({
                ID: item?.subaccountId,
                region: item?.dataCenterName,
                name: item?.subaccountName || item?.subaccountId,
                environment: (item?.dataCenterName as string)?.split('-')[0].toUpperCase(),
                level: TAccountStructureLevels.SubAccount,
                parentID: item?.directoryId || item?.globalAccountId,
                treeLevel: item?.directoryId ? 3 : 2,
                treeState: 'expanded',
                managedTagAllocations: Settings.tagConfiguration.defaultTagLevel == TAccountStructureLevels.SubAccount ? JSON.parse(JSON.stringify(Settings.tagConfiguration.defaultTags)) : [],
                customTags: [{ name: 'Hierarchy', value: `3-${TAccountStructureLevels.SubAccount}` }]
            })
        });
    [...new Set(data.filter(x => !!x.spaceId).map(x => x.spaceId))]
        .forEach(id => {
            const item = data.find(x => x.spaceId == id)
            item?.spaceId && structureItems.push({
                ID: item?.spaceId,
                region: item?.dataCenterName,
                name: item?.spaceName || item?.spaceId,
                environment: (item?.dataCenterName as string)?.split('-')[0].toUpperCase(),
                level: TAccountStructureLevels.Space,
                parentID: item?.subaccountId,
                treeLevel: item?.directoryId ? 4 : 3,
                treeState: 'expanded',
                managedTagAllocations: Settings.tagConfiguration.defaultTagLevel == TAccountStructureLevels.Space ? JSON.parse(JSON.stringify(Settings.tagConfiguration.defaultTags)) : [],
                customTags: [{ name: 'Hierarchy', value: `4-${TAccountStructureLevels.Space}` }]
            })
        });
    [...new Set(data.filter(x => !!x.environmentInstanceId).map(x => x.environmentInstanceId))]
        .forEach(id => {
            const item = data.find(x => x.environmentInstanceId == id)
            item?.environmentInstanceId && structureItems.push({
                ID: item?.environmentInstanceId,
                region: item?.dataCenterName,
                name: item?.environmentInstanceName || item?.environmentInstanceId,
                environment: (item?.dataCenterName as string)?.split('-')[0].toUpperCase(),
                level: TAccountStructureLevels.Instance,
                parentID: item?.subaccountId,
                treeLevel: item?.directoryId ? 4 : 3,
                treeState: 'leaf',
                managedTagAllocations: [], // There are no cost allocations on this level, so no need for a tag
                customTags: [], // There are no cost allocations on this level, so no need for a tag
                excluded: true // There are no cost allocations on this level, so no need for a tag
            })
        });

    // Service records: service item under Sub Account, or service (alloc) under space
    [...new Set(data.filter(x => !!x.serviceId).map(x => x.serviceId))]
        .forEach(id => {
            const spaceItems = groupByKeys(data.filter(x => x.serviceId == id).filter(x => !!x.spaceId), ['serviceId', 'spaceId'])
            const subaccountItems = groupByKeys(data.filter(x => x.serviceId == id).filter(x => !x.spaceId), ['serviceId', 'subaccountId'])
            const itemsByParent = [
                ... (Object.keys(spaceItems).length > 0 ? Object.values(spaceItems).flatMap(x => x[0]) : []),
                ... (Object.keys(subaccountItems).length > 0 ? Object.values(subaccountItems).flatMap(x => x[0]) : [])
            ]
            for (const item of itemsByParent) {
                const isSpaceLevel = item?.spaceId ? true : false
                const itemLevel = isSpaceLevel ? TAccountStructureLevels.ServiceInSpace : TAccountStructureLevels.ServiceInSubaccount
                const itemParentID = item?.spaceId || item?.subaccountId
                const itemID = `${itemParentID}_${item?.serviceId}`
                item?.serviceId && structureItems.push({
                    ID: itemID,
                    region: item?.dataCenterName,
                    name: item?.serviceName || item?.serviceId,
                    environment: (item?.dataCenterName as string)?.split('-')[0].toUpperCase(),
                    level: itemLevel,
                    parentID: itemParentID,
                    treeLevel: item?.directoryId ? (isSpaceLevel ? 5 : 4) : (isSpaceLevel ? 4 : 3),
                    treeState: (!isSpaceLevel && Settings.appConfiguration.serviceInstancesCreationList.includes(item?.serviceId)) ? 'expanded' : 'leaf',
                    managedTagAllocations: Settings.tagConfiguration.defaultTagLevel == itemLevel ? JSON.parse(JSON.stringify(Settings.tagConfiguration.defaultTags)) : [],
                    customTags: [{ name: 'Hierarchy', value: `${isSpaceLevel ? 5 : 4}-${itemLevel}` }]
                })
            }
            // new level under Service (only under Sub Account): instances
            if (Settings.appConfiguration.serviceInstancesCreationList.includes(id)) {
                [...new Set(data.filter(x => x.serviceId == id).filter(x => !!x.instanceId).map(x => x.instanceId))]
                    .forEach(instanceId => {
                        const item = data.find(x => x.instanceId == instanceId && x.serviceId == id)
                        const itemParentID = `${item?.subaccountId}_${item?.serviceId}`
                        const itemID = `${itemParentID}_${item?.instanceId}`
                        item?.instanceId && structureItems.push({
                            ID: itemID,
                            region: item?.dataCenterName,
                            name: item?.instanceId,
                            environment: (item?.dataCenterName as string)?.split('-')[0].toUpperCase(),
                            level: TAccountStructureLevels.InstanceOfService,
                            parentID: itemParentID,
                            treeLevel: item?.directoryId ? 5 : 4,
                            treeState: Settings.appConfiguration.serviceInstanceApplicationsCreationList.includes(item?.serviceId) ? 'expanded' : 'leaf',
                            managedTagAllocations: Settings.tagConfiguration.defaultTagLevel == TAccountStructureLevels.InstanceOfService ? JSON.parse(JSON.stringify(Settings.tagConfiguration.defaultTags)) : [],
                            customTags: [{ name: 'Hierarchy', value: `5-${TAccountStructureLevels.InstanceOfService}` }]
                        })
                    });
            }
            // new level under Service Instance (only under Sub Account): instance applications
            if (Settings.appConfiguration.serviceInstanceApplicationsCreationList.includes(id)) {
                [...new Set(data.filter(x => x.serviceId == id).filter(x => !!x.application).map(x => x.application))]
                    .forEach(applicationId => {
                        const item = data.find(x => x.application == applicationId && x.serviceId == id)
                        const itemParentID = `${item?.subaccountId}_${item?.serviceId}_${item?.instanceId}`
                        const itemID = `${itemParentID}_${item?.application}`
                        item?.application && structureItems.push({
                            ID: itemID,
                            region: item?.dataCenterName,
                            name: item?.application,
                            environment: (item?.dataCenterName as string)?.split('-')[0].toUpperCase(),
                            level: TAccountStructureLevels.ApplicationInService,
                            parentID: itemParentID,
                            treeLevel: item?.directoryId ? 6 : 5,
                            treeState: 'leaf',
                            managedTagAllocations: Settings.tagConfiguration.defaultTagLevel == TAccountStructureLevels.ApplicationInService ? JSON.parse(JSON.stringify(Settings.tagConfiguration.defaultTags)) : [],
                            customTags: [{ name: 'Hierarchy', value: `6-${TAccountStructureLevels.ApplicationInService}` }]
                        })
                    });
            }
        });

    const existingStructureItems = (await SELECT.from(dbAccountStructureItems).columns('ID')).map(x => x.ID)
    const newStructureItems = structureItems.filter(x => !existingStructureItems.includes(x.ID))
    newStructureItems.length > 0 && await INSERT.into(AccountStructureItems).entries(newStructureItems)

    // To cater for changes in the account structure (moving of subaccounts into directories, renaming subaccounts, ...), we need to update the account structure, while preserving the data elements already changed by the user
    const updatedStructureItems = structureItems.filter(x => existingStructureItems.includes(x.ID))
    updatedStructureItems.forEach(x => {
        // remove items already updated by the user from the update query
        delete x.lifecycle
        delete x.excluded
        delete x.managedTagAllocations
        delete x.customTags
    })
    updatedStructureItems.length > 0 && await UPSERT.into(AccountStructureItems).entries(updatedStructureItems) // using UPSERT until array UPDATE is available
}

/**
 * Calculates the forecasted values for the daily measurements
 * @param serviceId optional name of the service to restrict the update only to that service
 * @returns string
 */
async function updateCommercialMetricForecasts(serviceId?: string) {
    info(`Updating forecast data ...`)

    let status = ''
    if (cds.env.requires.db.kind == 'hana') {
        // Use single SQL query that can be executed in HANA (faster)
        const where = serviceId ? ` WHERE (SERVICEID = '${serviceId}')` : ''
        const onClause =
            `sourceTable.REPORTYEARMONTH        = targetTable.TOMETRIC_TOSERVICE_REPORTYEARMONTH 
            AND sourceTable.RETRIEVED           = targetTable.TOMETRIC_TOSERVICE_RETRIEVED
            AND sourceTable.SERVICEID           = targetTable.TOMETRIC_TOSERVICE_SERVICEID
            AND sourceTable.INTERVAL            = targetTable.TOMETRIC_TOSERVICE_INTERVAL
            AND sourceTable.MEASUREID           = targetTable.TOMETRIC_MEASUREID
            AND sourceTable.ID                  = targetTable.ID
            AND sourceTable.LEVEL               = targetTable.LEVEL`
        const updateClause =
            `targetTable.MAX_COST               = sourceTable.MAX_COST,
            targetTable.FORECASTPCT             = ROUND(COALESCE(sourceTable.forecastPct, 100), 0),
            targetTable.FORECAST_COST           = ROUND(sourceTable.MEASURE_COST * sourceTable.multiplier, 2),
            targetTable.FORECAST_USAGE          = ROUND(sourceTable.MEASURE_USAGE * sourceTable.multiplier, 2),
            targetTable.FORECAST_ACTUALUSAGE    = ROUND(sourceTable.MEASURE_ACTUALUSAGE * sourceTable.multiplier, 2),
            targetTable.FORECAST_CHARGEDBLOCKS  = ROUND(sourceTable.MEASURE_CHARGEDBLOCKS * sourceTable.multiplier, 2)`
        const sql =
            `MERGE INTO ${CommercialMeasures.name.replace('.', '_')} AS targetTable
            USING (SELECT * FROM ${prepareCommercialMeasureMetricForecasts.name.replace('.', '_')}${where}) AS sourceTable
            ON ${onClause} WHEN MATCHED THEN UPDATE SET ${updateClause}`
        const rows = await db.run(sql)
        status = `${rows.changes ?? rows} forecasts updated in the database (hana optimized).`
    } else {
        // Fallback approach which routes the data via the application layer (slower)
        let forecasted: CommercialMeasures = []
        const measures = await SELECT.from(prepareCommercialMeasureMetricForecasts).where(serviceId && { serviceId: serviceId } || {})
        for (const measure of measures) {
            const multiplier = measure.multiplier ?? 1
            const forecast: TCommercialMeasure = {
                cost: fixDecimals((measure.measure_cost ?? 0) * multiplier),
                usage: fixDecimals((measure.measure_usage ?? 0) * multiplier),
                actualUsage: fixDecimals((measure.measure_actualUsage ?? 0) * multiplier),
                chargedBlocks: fixDecimals((measure.measure_chargedBlocks ?? 0) * multiplier)
            }
            forecasted.push({
                toMetric: {
                    toService: {
                        reportYearMonth: measure.reportYearMonth,
                        serviceId: measure.serviceId,
                        retrieved: measure.retrieved,
                        interval: measure.interval
                    },
                    measureId: measure.measureId,
                },
                level: measure.level,
                id: measure.id,
                ...  { forecast },
                forecastPct: fixDecimals(measure.forecastPct ?? 100, 0),
                max_cost: measure.max_cost
            })
        }
        forecasted = forecasted.map(x => flattenObject(x))

        forecasted.length > 0 && await UPSERT.into(CommercialMeasures).entries(forecasted)
        status = `${forecasted.length} forecasts updated in the database (fallback legacy).`
    }

    info(status)
    return status
}
/**
 * Calculates the forecasted values for the daily measurements, aggregated on service level
 * @param serviceId optional name of the service to restrict the update only to that service
 * @returns string
 */
async function updateCommercialServiceForecasts(serviceId?: string) {
    info(`Updating commercial sum by level data ...`)

    let status = ''
    if (cds.env.requires.db.kind == 'hana') {
        // Use single SQL query that can be executed in HANA (faster)
        const where = serviceId ? ` WHERE (toMetric_toService_serviceId = '${serviceId}')` : ''
        const sql = `UPSERT ${CommercialMeasures.name.replace('.', '_')} SELECT * FROM ${prepareCommercialMeasureServiceForecasts.name.replace('.', '_')}${where}`
        const rows = await db.run(sql)
        status = `${rows.changes ?? rows} data points updated in the database (hana optimized).`
    } else {
        // Fallback approach which routes the data via the application layer (slower)
        const data = await SELECT.from(prepareCommercialMeasureServiceForecasts).where(serviceId && { toMetric_toService_serviceId: serviceId } || {})
        data.length > 0 && await UPSERT.into(CommercialMeasures).entries(data)
        status = `${data.length} data points updated in the database (fallback legacy).`
    }

    info(status)
    return status
}

/**
 * Updates the database with LAG values for the measures
 * @returns status message
 */
async function updateDailyDeltaMeasures() { return updateDeltaMeasures(TInterval.Daily) }
async function updateMonthlyDeltaMeasures() { return updateDeltaMeasures(TInterval.Monthly) }
async function updateDeltaMeasures(interval: TInterval) {
    info(`Updating ${interval} delta calculations for all measures ...`)

    let status = ''
    if (cds.env.requires.db.kind == 'hana') {
        const overPartitionSQLDaily =
            `OVER (PARTITION BY
                toMetric_toService_reportYearMonth,
                toMetric_toService_serviceId,
                toMetric_toService_interval,
                toMetric_measureId,
                level,
                id
            ORDER BY
                toMetric_toService_retrieved)`
        const overPartitionSQLMonthly =
            `OVER (PARTITION BY
                    toMetric_toService_serviceId,
                    toMetric_toService_interval,
                    toMetric_measureId,
                    level,
                    id
                ORDER BY
                    toMetric_toService_retrieved)`
        const keyColumns = [
            'toMetric_toService_reportYearMonth',
            'toMetric_toService_retrieved',
            'toMetric_toService_serviceId',
            'toMetric_toService_interval',
            'toMetric_measureId',
            'level',
            'id',
        ]
        const commercialDeltaColumns = [
            'measure_cost',
            'measure_usage',
            'measure_actualUsage',
            'measure_chargedBlocks',
            'forecast_cost',
            'forecast_usage',
            'forecast_actualUsage',
            'forecast_chargedBlocks'
        ]
        const technicalDeltaColumns = [
            'measure_usage',
        ]

        const keyColumnsSQL = keyColumns.join(', ')
        const joinClauseSQL = keyColumns.map(x => `targetTable.${x} = sourceTable.${x}`).join(' and ')

        // Technical deltas
        const technicalDeltaColumnsSelectSQLDaily = technicalDeltaColumns.map(x => `${x}, ${x} - LAG(${x}) ${overPartitionSQLDaily} AS delta_${x}`).join(', ')
        const technicalDeltaColumnsSelectSQLMonthly = technicalDeltaColumns.map(x => `${x}, ${x} - LAG(${x}) ${overPartitionSQLMonthly} AS delta_${x}`).join(', ')
        const technicalDeltaColumnsUpdateSQL = [
            technicalDeltaColumns.map(x => `targetTable.delta_${x} = sourceTable.delta_${x}`).join(', '),
            technicalDeltaColumns.map(x => `targetTable.delta_${x}Pct = ROUND( COALESCE( sourceTable.delta_${x} * 100 / NULLIF( sourceTable.${x} - sourceTable.delta_${x}, 0), 0))`).join(', ')
        ].join(', ')

        let technicalRows = 0
        if (interval == TInterval.Daily)
            technicalRows += (await db.run(
                `MERGE INTO ${TechnicalMeasures.name.replace('.', '_')} AS targetTable
                USING (SELECT ${keyColumnsSQL}, ${technicalDeltaColumnsSelectSQLDaily} FROM ${TechnicalMeasures.name.replace('.', '_')} WHERE (toMetric_toService_interval = 'Daily')) AS sourceTable
                ON ${joinClauseSQL} WHEN MATCHED THEN UPDATE SET ${technicalDeltaColumnsUpdateSQL}`)).changes
        if (interval == TInterval.Monthly)
            technicalRows += (await db.run(
                `MERGE INTO ${TechnicalMeasures.name.replace('.', '_')} AS targetTable
                USING (SELECT ${keyColumnsSQL}, ${technicalDeltaColumnsSelectSQLMonthly} FROM ${TechnicalMeasures.name.replace('.', '_')} WHERE (toMetric_toService_interval = 'Monthly')) AS sourceTable
                ON ${joinClauseSQL} WHEN MATCHED THEN UPDATE SET ${technicalDeltaColumnsUpdateSQL}`)).changes

        // Commercial deltas
        const commercialDeltaColumnsSelectSQLDaily = commercialDeltaColumns.map(x => `${x}, ${x} - LAG(${x}) ${overPartitionSQLDaily} AS delta_${x}`).join(', ')
        const commercialDeltaColumnsSelectSQLMonthly = commercialDeltaColumns.map(x => `${x}, ${x} - LAG(${x}) ${overPartitionSQLMonthly} AS delta_${x}`).join(', ')
        const commercialDeltaColumnsUpdateSQL = [
            commercialDeltaColumns.map(x => `targetTable.delta_${x} = sourceTable.delta_${x}`).join(', '),
            commercialDeltaColumns.map(x => `targetTable.delta_${x}Pct = ROUND( COALESCE( sourceTable.delta_${x} * 100 / NULLIF( sourceTable.${x} - sourceTable.delta_${x}, 0), 0))`).join(', ')
        ].join(', ')

        let commercialRows = 0
        if (interval == TInterval.Daily)
            commercialRows += (await db.run(
                `MERGE INTO ${CommercialMeasures.name.replace('.', '_')} AS targetTable
                USING (SELECT ${keyColumnsSQL}, ${commercialDeltaColumnsSelectSQLDaily} FROM ${CommercialMeasures.name.replace('.', '_')} WHERE (toMetric_toService_interval = 'Daily')) AS sourceTable
                ON ${joinClauseSQL} WHEN MATCHED THEN UPDATE SET ${commercialDeltaColumnsUpdateSQL}`)).changes
        if (interval == TInterval.Monthly)
            commercialRows += (await db.run(
                `MERGE INTO ${CommercialMeasures.name.replace('.', '_')} AS targetTable
                USING (SELECT ${keyColumnsSQL}, ${commercialDeltaColumnsSelectSQLMonthly} FROM ${CommercialMeasures.name.replace('.', '_')} WHERE (toMetric_toService_interval = 'Monthly')) AS sourceTable
                ON ${joinClauseSQL} WHEN MATCHED THEN UPDATE SET ${commercialDeltaColumnsUpdateSQL}`)).changes

        status = `${technicalRows} technical and ${commercialRows} commercial ${interval} deltas updated (hana optimized).`
    } else {
        status = 'No deltas updated (hana feature only)'
    }

    info(status)
    return status
}

async function retrieveCreditDetails() {
    info(`Getting cloud credit details ...`)

    let status = ''

    const creditDetails = (await api_creditDetails({ viewPhases: 'ALL' }) as CloudCreditsDetails)
        .filter(x => x.contracts && x.contracts?.length > 0)

    for (const globalAccount of creditDetails) {
        let values: ContractCreditValue[] = []

        // Aggregate all phaseUpdates
        globalAccount.contracts?.forEach(contract => {
            contract.phases?.forEach(phase => {
                if (phase.phaseUpdates) {
                    values = [
                        ...values,
                        ...phase.phaseUpdates
                            // remove updates that happened before the start date of the phase
                            .filter(update => new Date(update.phaseUpdatedOn!) >= new Date(phase.phaseStartDate!))
                            .map(update => {
                                return {
                                    contractStartDate: stringToCdsDate(contract.contractStartDate!),
                                    contractEndDate: stringToCdsDate(contract.contractEndDate!),
                                    currency: contract.currency,
                                    phaseStartDate: stringToCdsDate(phase.phaseStartDate!),
                                    phaseEndDate: stringToCdsDate(phase.phaseEndDate!),
                                    yearMonth: update.phaseUpdatedOn && getPreviousMonth(new Date(update.phaseUpdatedOn)).toString() || '',
                                    phaseUpdatedOn: stringToCdsDate(update.phaseUpdatedOn!),
                                    cloudCreditsForPhase: update.cloudCreditsForPhase,
                                    balance: update.balance,
                                    status: TCreditStatus.Actual
                                }
                            })
                    ]
                }
            })
        })

        // Remove obsolete (outdated) entries
        globalAccount.valueUpdates = (
            Object.values(groupByKeys(values, ['yearMonth']))
                .flatMap(group =>
                    group.sort((a, b) => new Date(a.phaseUpdatedOn!) < new Date(b.phaseUpdatedOn!) ? 1 : -1)
                        .at(0)
                ) as ContractCreditValue[]
        ).sort((a, b) => a.yearMonth! > b.yearMonth! ? 1 : -1)

        // Add phaseUpdates for projections until phaseEndDate
        if (globalAccount.valueUpdates && globalAccount.valueUpdates.length > 0) {
            const mostRecent = globalAccount.valueUpdates.at(-1)!
            const endMonth = dateToYearMonth(new Date(mostRecent.phaseEndDate!.toString()))

            let currentMonth = mostRecent.yearMonth!
            while (currentMonth < endMonth) {
                currentMonth = getNextMonth(currentMonth).toString()
                globalAccount.valueUpdates.push({
                    contractStartDate: mostRecent.contractStartDate,
                    contractEndDate: mostRecent.contractEndDate,
                    currency: mostRecent.currency,
                    phaseStartDate: mostRecent.phaseStartDate,
                    phaseEndDate: mostRecent.phaseEndDate,
                    yearMonth: currentMonth,
                    phaseUpdatedOn: stringToCdsDate(dateToISODate()),
                    cloudCreditsForPhase: mostRecent.cloudCreditsForPhase,
                    balance: null,
                    status: TCreditStatus.Projection
                })
            }

        }

        // Apply currency conversion if needed
        applyCurrencyConversion(globalAccount.valueUpdates, 'currency', ['cloudCreditsForPhase', 'balance'])
    }

    await DELETE.from(CloudCreditsDetails)
    try {
        creditDetails.length > 0 && await INSERT.into(CloudCreditsDetails).entries(creditDetails)
    } catch (error) {
        info('Attempted data insert:', creditDetails)
        throw error
    }

    status = `${creditDetails.length || 0} contract items updated in the database.`
    info(status)
    return status
}

async function sendNotification() {
    info(`Sending alerts ...`)

    const alerts = (await SELECT.from(Alerts).columns(a => {
        a('*'),
            a.thresholds('*'),
            a.serviceItems('*'),
            a.levelItems('*')
    }) as Alerts)
        .filter(x => x.active)

    const data = await fetchMeasuresForAlerts(alerts)
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
async function api_sendNotification(event: CustomerResourceEvent) {
    const serviceDestination = await getServiceDestination('ANS', 'btprc-notif')
    return ResourceEventsApi
        .postResourceEvent(event)
        .skipCsrfTokenFetching()
        .execute(serviceDestination)
}

async function fetchMeasuresForAlerts(alerts: Alerts): Promise<{ alert: Alert; measures: any[] }[]> {
    const result: { alert: Alert, measures: any[] }[] = []
    for (const alert of alerts) {
        const request = buildRequestForAlert(alert)
        let measures: any[] = []
        try {
            measures = await request.req
        } catch (error) {
            warn(error)
            alert.name = `${alert.name}:  [${String(error)}]`
            measures = [{ name: 'Please fix alert configuration' }]
        }

        measures.forEach(m => {
            m.metricName = m.toMetric_measureId == '_combined_' ? 'Multiple' : (m.toMetric_measureId || m.metricName)
            m.serviceName = m.toMetric_toService_serviceName || m.toMetric_toService_serviceName
        })
        result.push({
            alert: alert as Alert,
            measures
        })
    }

    return result
}

function buildRequestForAlert(alert: Alert): { json: Object; sql: string; req: cds.ql.SELECT<typeof CommercialMeasures | typeof TechnicalMeasures> } {
    const serviceItemsList = alert.serviceItems?.map(x => x.itemID?.slice(8)) || [] //Cut 'service_' or 'cmetric_' or 'tmetric_' off from the stored ID
    const levelItemsList = alert.levelItems?.map(x => x.itemID) || []

    const json: CommercialMeasure = {
        // Add static filters
        toMetric_toService_retrieved: dateToISODate(),

        // Add filters for included/excluded levels by name
        level: alert.levelScope,
        ...(levelItemsList && levelItemsList.length > 0) && {
            id: (alert.levelMode == TInExclude.Include)
                ? { 'in': levelItemsList }
                : { 'not in': levelItemsList }
        },

        // Add filters for included/excluded Services/Metrics
        ...alert.serviceScope == TServiceScopes.Service
            ? {
                ...(serviceItemsList && serviceItemsList.length > 0) && {
                    toMetric_toService_serviceId: (alert.serviceMode == TInExclude.Include)
                        ? { 'in': serviceItemsList }
                        : { 'not in': serviceItemsList }
                },
                toMetric_measureId: '_combined_'
            }
            : {
                toMetric_measureId: (alert.serviceMode == TInExclude.Include && serviceItemsList && serviceItemsList.length > 0)
                    ? { 'in': serviceItemsList }
                    : { 'not in': [...(serviceItemsList && serviceItemsList.length > 0 ? serviceItemsList : []), '_combined_'] }
            },

        // Add filters for dynamic thresholds
        ...alert.thresholds?.reduce((p: any, c: any) => {
            p[c.property] = { [c.operator]: c.amount }
            return p
        }, {})
    }

    let req
    if (alert.alertType == TAlertType.Commercial) {
        req = SELECT.from(CommercialMeasures)
            .columns(a => { a('*'), a.toMetric?.metricName, a.toMetric?.toService?.serviceName })
            .where(json)
            .orderBy('toMetric_toService_serviceId', 'toMetric_measureId')
    } else {
        req = SELECT.from(TechnicalMeasures)
            .columns(a => { a('*'), a.toMetric?.metricName, a.toMetric?.toService?.serviceName })
            .where(json)
            .orderBy('toMetric_toService_serviceId', 'toMetric_measureId')
    }


    const sql = req + ''

    return { json, sql, req }
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
                    [item.toService_serviceId, item.measureId, item.measure_cost, item.forecast_cost, item.currency]
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
                    [item.toService_serviceId, item.measureId, item.measure_usage, item.unit]
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
        //@ts-expect-error
        const line = columns.map(c => setColumnWidth(m[c.value]?.toString() ?? '', c))
        return `| ${line.join(` | `)} | `
    })

    return `${name}\r\n\r\n${header}\r\n${line}\r\n${rows.join('\r\n')}\r\n\r\n\r\n`
}
function setColumnWidth(value: string, settings: alertTableColumn) {
    return settings.padStart
        ? value.slice(0, settings.width).padStart(settings.width)
        : value.slice(0, settings.width).padEnd(settings.width)
}
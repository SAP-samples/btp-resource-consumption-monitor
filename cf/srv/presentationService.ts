import cds from '@sap/cds'

import {
    dateToYearMonth,
    flattenObject,
    formatTags,
    addRequiredColumns
} from './functions'

import {
    BTPAccountMeasures,
    BTPService,
    BTPServices,
    CommercialMeasure,
    CommercialMetric,
    CommercialMetrics,
    TechnicalMetrics,
    TechnicalMetric,
    getLatestBTPAccountMeasure,
    getTileInfo,
    proxy_downloadMeasuresForPastMonths,
    proxy_downloadMeasuresForToday,
    proxy_deleteAllData,
    proxy_resetForecastSettings,
    proxy_calculateCommercialForecasts,
    Card_HighestForecastServices,
} from '#cds-models/PresentationService'

import {
    ZBTPService,
    ZCommercialMetric,
    ZTechnicalMetric,
} from './zPresentationServiceTypes'

import {
    calculateCommercialForecasts,
    calculateCommercialForecastsForService,
    deleteAllData,
    downloadMeasuresForToday,
    downloadMeasuresForPastMonths,
    resetForecastSettings,
} from '#cds-models/RetrievalService'

import {
    TBulletChart,
    TDynamicAppLauncher,
    TForecastMethod,
    TInterval
} from '#cds-models/types'

import {
    ForecastSetting,
    ForecastSettings,
} from '#cds-models/db'

const info = cds.log('presentationService').info

enum statusMap { Good = 3, Warning = 2, Error = 1, Neutral = 0 }
enum multipliers { Normal = 100, WarningMax = 125, ErrorMax = 150 }

export default class PresentationService extends cds.ApplicationService {
    async init() {

        // Connect to Retrieval Service to send triggers
        const retrievalService = await cds.connect.to('RetrievalService')

        /**
         * Handlers for BTPServices
         */
        this.before('READ', BTPServices, req => {
            addRequiredMeasureColumns<ZBTPService>(req.query, 'cmByGlobalAccount', ['max_cost', 'measure_cost', 'forecast_cost', 'forecastPct'])
            addSortMeasureColumns<ZBTPService>(req.query, 'cmByDirectory', 'measure_cost', true)
            addSortMeasureColumns<ZBTPService>(req.query, 'cmBySubAccount', 'measure_cost', true)
        })
        this.after('READ', BTPServices, items => {
            items?.forEach(each => {
                const measure = (each as ZBTPService).cmByGlobalAccount
                if (measure) {
                    addBulletChartValues(measure)
                    measure.forecastPct !== null && addCriticalityValues(measure)
                }
                if (each.namesCommercialMetrics) {
                    each.namesCommercialMetrics = [...new Set(each.namesCommercialMetrics.split('__'))].join(' - ')
                }
            })
        })


        /**
         * Handlers for CommercialMetrics
         */
        this.before('READ', CommercialMetrics, req => {
            addRequiredMeasureColumns<ZCommercialMetric>(req.query, 'cmByGlobalAccount', ['max_cost', 'measure_cost', 'forecast_cost', 'forecastPct'])
            addSortMeasureColumns<ZCommercialMetric>(req.query, 'cmByDirectory', 'measure_cost', true)
            addSortMeasureColumns<ZCommercialMetric>(req.query, 'cmBySubAccount', 'measure_cost', true)
        })
        this.after('READ', CommercialMetrics, items => {
            items?.forEach(each => {
                const measure = (each as ZCommercialMetric).cmByGlobalAccount
                if (measure) {
                    addBulletChartValues(measure)
                    measure.forecastPct !== null && addCriticalityValues(measure)
                }
                each.tagStrings = each.tags ? formatTags(each.tags) : '(none)'
            })
        })

        /**
         * Handlers for TechnicalMetrics
         */
        this.before('READ', TechnicalMetrics, req => {
            addSortMeasureColumns<ZTechnicalMetric>(req.query, 'tmByDirectory', 'measure_usage', true)
            addSortMeasureColumns<ZTechnicalMetric>(req.query, 'tmBySubAccount', 'measure_usage', true)
            addRequiredColumns<ZTechnicalMetric>(req.query, ['tags'])
        })
        this.after('READ', TechnicalMetrics, items => {
            items?.forEach(each => {
                each.tagStrings = each.tags ? formatTags(each.tags) : '(none)'
            })
        })

        /**
         * Handlers for Work Zone cards
         */
        this.after('READ', Card_HighestForecastServices, items => {
            items?.forEach(each => {
                const measure = (each as ZBTPService).cmByGlobalAccount
                if (measure) {
                    measure.forecastPct !== null && addCriticalityValues(measure)
                }
                if (each.namesCommercialMetrics) {
                    each.namesCommercialMetrics = [...new Set(each.namesCommercialMetrics.split('__'))].join(' - ')
                }
            })
        })

        this.on(proxy_downloadMeasuresForToday, async (req) => req.info(await retrievalService.send(downloadMeasuresForToday.toString())))
        this.on(proxy_downloadMeasuresForPastMonths, async (req) => req.info(await retrievalService.send(downloadMeasuresForPastMonths.toString(), { fromDate: Number(req.data.fromDate) })))
        this.on(proxy_deleteAllData, async (req) => req.info(await retrievalService.send(deleteAllData.toString())))
        this.on(proxy_resetForecastSettings, async (req) => req.notify(await retrievalService.send(resetForecastSettings.toString())))
        this.on(proxy_calculateCommercialForecasts, async (req) => req.notify(await retrievalService.send(calculateCommercialForecasts.toString())))

        // Received from UI when Forecast Settings are changed
        this.on(CommercialMetric.actions.SetForecastSetting, async (req) => {
            const serviceName = (req.params[0] as BTPService).serviceName
            const metricName = (req.params[1] as CommercialMetric).metricName
            const { method, degressionFactor } = req.data

            info(`Setting forecast config for service [${serviceName}], metric [${metricName}] to ${method} with factor ${degressionFactor}`)

            const forecastSetting: ForecastSetting = {
                serviceName,
                metricName,
                method: method as TForecastMethod,
                degressionFactor
            }
            const nbItems = await UPSERT.into(ForecastSettings).entries(forecastSetting)
            const status = `${nbItems} records updated in the database.`
            info(status)

            // Trigger a recalculation of the forecasts for this Service            
            await retrievalService.send(calculateCommercialForecastsForService.toString(), { serviceName: serviceName })

            return status
        })

        this.on(BTPService.actions.deleteBTPService, async req => {
            const item = req.params.slice(-1)[0] as BTPService
            await DELETE(BTPServices, item)
            await retrievalService.send(calculateCommercialForecastsForService.toString(), { serviceName: item.serviceName })
        })
        this.on(CommercialMetric.actions.deleteCommercialMetric, async req => {
            const item = req.params.slice(-1)[0] as CommercialMetric
            console.log(item);

            await DELETE(CommercialMetrics, item)
            await retrievalService.send(calculateCommercialForecastsForService.toString(), { serviceName: item.toService_serviceName })
        })
        this.on(TechnicalMetric.actions.deleteTechnicalMetric, async req => {
            const item = req.params.slice(-1)[0] as TechnicalMetric
            await DELETE(TechnicalMetrics, item)
        })

        this.on(getLatestBTPAccountMeasure, async req => {
            const data = await SELECT.one
                .from(BTPAccountMeasures)
                .where({ interval: TInterval.Daily })
                .orderBy('retrieved desc')
            return [data]
        })

        // Received from Work Zone to display Tile information
        this.on(getTileInfo, async (req) => {
            const thisMonth = dateToYearMonth()
            const info = await SELECT.one
                .from(BTPAccountMeasures)
                .where({ interval: TInterval.Daily })
                .orderBy('retrieved desc')
            const tile: TDynamicAppLauncher = {
                title: 'BTP Resource Consumption',
                subtitle: 'Report',
                icon: 'sap-icon://money-bills',
                info: '',
                infoState: '',
                //@ts-expect-error
                number: info.forecast_cost,
                numberDigits: 2,
                numberFactor: '',
                numberState: 'Neutral',
                numberUnit: `${thisMonth} forecast`,
                stateArrow: ''
            }
            return tile
        })

        return super.init()
    }
}

/**
 * Make sure that any query that expands into any measurements has the required columns to calculate the values and criticality of the chart.
 * This is a coding alternative to RequestAtLeast annotation which only applies to List Views and not to Object Pages.
 * @param query the SELECT request query
 * @param entity name of the expand which needs to be have the additional columns
 * @param requiredColumns columns to add (if not in the expand already)
 * @example
 *      refColumns sample:
 *          [
 *              { ref: ['toService_serviceName'] },
 *              { ref: ['metricName'] },
 *              { ref: ['level'] },
 *              { ref: ['name'] },
 *              { ref: ['measure_actualUsage'] },
 *              ...
 *          ]
 *
 *       Need to add:
 *          { ref: ['requiredColumn'] }
 */
function addRequiredMeasureColumns<T>(query: Partial<cds.SELECT>, entity: keyof T, requiredColumns: string[]): void {
    const refColumns = query.SELECT?.columns?.find(x => x.ref?.toString() == entity)?.expand
    if (refColumns) {
        for (const requiredColumn of requiredColumns) {
            if (!refColumns.find(expand => typeof expand == 'string' || expand.ref && expand.ref.find(x => x == requiredColumn))) {
                refColumns.push({ ref: [requiredColumn] })
                info(`!! Added column ${requiredColumn} manually to query`)
            }
        }
    }
}


/**
 * Make sure that any query used in Micro Charts has its data sorted correctly.
 * This is a coding alternative to the PresentationVariants annotation which is not available for Header Micro Charts.
 * @param query the SELECT request query
 * @param entity name of the expand which needs to be sorted
 * @param sortColumn column to sort on
 * @param descending sort direction
 * @example
 *      refColumns sample:
 *          {
 *              ref: ['cmByDirectory'],
 *              expand: [
 *                  { ref: [Array] },
 *                  { ref: [Array] }
 *              ],
 *              orderBy?: [...]
 *          }
 *       
 *      Need to add:
 *          orderBy: [ { ref: ['sortColumn'], sort: 'asc/desc' } ]
 */
function addSortMeasureColumns<T>(query: Partial<cds.SELECT>, entity: keyof T, sortColumn: string, descending: boolean = false): void {
    const refColumns = query.SELECT?.columns?.find(x => x.ref?.toString() == entity)
    if (refColumns) {
        Object.assign(refColumns, {
            orderBy: [
                //@ts-expect-error
                ...refColumns.orderBy ?? [],
                { ref: [sortColumn], sort: descending ? 'desc' : 'asc' }
            ]
        })
        info(`!! Added sorting manually in ${entity.toString()} query for ${sortColumn} column`)
    }
}

/**
 * Calculate the min-target-max and criticality values for a Bullet Chart for this measure
 * @param measure measure to be manipulated (enriched)
 */
function addBulletChartValues(measure: CommercialMeasure): void {
    // Set default values
    let chart: TBulletChart = {
        min: 0,
        //@ts-expect-error
        max: Number(measure.measure_cost),
        //@ts-expect-error
        value: Number(measure.measure_cost),
        //@ts-expect-error
        target: Number(measure.measure_cost),
        // @ts-expect-error
        forecast: Number(measure.forecast_cost),
        criticality: statusMap.Neutral
    }

    // If target values can be calculated
    if (measure.max_cost) {
        let warningLevel = Number(measure.max_cost)
        let errorLevel = Number(measure.max_cost * multipliers.WarningMax / 100)

        chart.max = Number(measure.max_cost * multipliers.ErrorMax / 100)
        chart.target = Number(measure.max_cost)

        //Calculate Criticality based on Measure or Forecast, for Cost, Usage, ChargedBlocks or ActualUsage
        //@ts-expect-error
        const evaluatedProperty = Number(measure.forecast_cost)
        if (evaluatedProperty <= warningLevel) chart.criticality = statusMap.Good
        else if (evaluatedProperty <= errorLevel) chart.criticality = statusMap.Warning
        else chart.criticality = statusMap.Error
    }

    // Store the calculated values in the measure
    Object.assign(measure, flattenObject({ costChart: chart }))
}

/**
 * Calculate the criticality values for the Forecast Percentage for this measure
 * @param measure measure to be manipulated (enriched)
 */
function addCriticalityValues(measure: CommercialMeasure): void {
    let forecastPctCriticality = statusMap.Neutral
    if (measure.forecastPct) {
        if (measure.forecastPct <= multipliers.Normal) forecastPctCriticality = statusMap.Good
        else if (measure.forecastPct <= multipliers.WarningMax) forecastPctCriticality = statusMap.Warning
        else forecastPctCriticality = statusMap.Error
    }
    Object.assign(measure, { forecastPctCriticality })
}

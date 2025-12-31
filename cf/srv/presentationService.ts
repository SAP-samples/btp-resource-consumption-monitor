import cds from '@sap/cds'

import {
    dateToYearMonth,
    flattenObject,
    formatTags,
    addRequiredColumns,
    reportYearMonthToText
} from './functions'

import {
    getUserAccessContext,
    UserAccessContext,
    addInFilter
} from './authorizationHelper'

import {
    AggregatedCommercialMeasures
} from '#cds-models/AnalyticsService';

import {
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
    proxy_resetTechnicalAllocations,
    SetBulkTechnicalAllocations,
    SetBulkForecastSettings,
    Card_HighestForecastServices,
    proxy_deleteStructureAndTagData
} from '#cds-models/PresentationService'

import RetrievalService from '#cds-models/RetrievalService'

import {
    TAggregationLevel,
    TBulletChart,
    TDynamicAppLauncher,
    TForecastMethod,
    TInterval
} from '#cds-models/types'

import {
    AllocationSetting,
    AllocationSettings,
    ForecastSetting,
    ForecastSettings
} from '#cds-models/db'
import { Settings } from './settings'

const info = cds.log('presentationService').info

// Store user access context per request for use across handlers
const requestContextMap = new WeakMap<object, UserAccessContext>()

enum statusMap { Good = 3, Warning = 2, Error = 1, Neutral = 0 }
enum multipliers { Normal = 100, WarningMax = 125, ErrorMax = 150 }
enum deltaThresholds { Normal = 3, WarningMax = 10 }

export default class PresentationService extends cds.ApplicationService {
    async init() {

        // Connect to Retrieval Service to send triggers
        const retrievalService = await cds.connect.to(RetrievalService)

        /**
         * Authorization: Filter AccountStructureItems by user access
         */
        this.before('READ', 'AccountStructureItems', async req => {
            const context = await getUserAccessContext(req)
            if (!context.isUnrestricted) {
                if (context.allowedIds.length === 0) {
                    // No access - return empty result
                    addInFilter(req.query, 'ID', ['__NO_ACCESS__'])
                } else {
                    addInFilter(req.query, 'ID', context.allowedIds)
                }
                info(`Authorization: Filtering AccountStructureItems to ${context.allowedIds.length} accessible IDs`)
            }
        })

        /**
         * Handlers for BTPServices
         */
        this.before('READ', BTPServices, async req => {
            // Get and store user access context for use in AFTER handler
            const context = await getUserAccessContext(req)
            requestContextMap.set(req, context)

            addRequiredMeasureColumns<BTPService>(req.query, 'cmByCustomer', ['max_cost', 'measure_cost', 'forecast_cost', 'forecastPct'])
            addSortMeasureColumns<BTPService>(req.query, 'cmByGlobalAccount', 'measure_usage', true)
            addSortMeasureColumns<BTPService>(req.query, 'cmByDirectory', 'measure_cost', true)
            addSortMeasureColumns<BTPService>(req.query, 'cmBySubAccount', 'measure_cost', true)
        })
        this.after('READ', BTPServices, (items, req) => {
            // Get user access context from BEFORE handler
            const context = requestContextMap.get(req)

            // Authorization: Filter out services with no accessible measures
            if (context && !context.isUnrestricted && Array.isArray(items)) {
                info(`Authorization: Filtering BTPServices for user with ${context.allowedIds.length} accessible IDs`)
                // Filter in place by marking items to remove
                const indicesToRemove: number[] = []
                items.forEach((each, index) => {
                    const hasAccess = filterNestedMeasures(each, context.allowedIds)
                    if (!hasAccess) {
                        indicesToRemove.push(index)
                    }
                })
                // Remove items in reverse order to maintain indices
                for (let i = indicesToRemove.length - 1; i >= 0; i--) {
                    items.splice(indicesToRemove[i], 1)
                }
                info(`Authorization: Filtered BTPServices from ${items.length + indicesToRemove.length} to ${items.length} services`)
            }

            items?.forEach(each => {
                const measure = (each as BTPService).cmByCustomer
                if (measure) {
                    addBulletChartValues(measure)
                    measure.forecastPctCriticality = getForecastCriticality(measure.forecastPct)
                    measure.deltaActualsCriticality = getDeltaCriticality(measure.delta_measure_costPct)
                    measure.deltaForecastCriticality = getDeltaCriticality(measure.delta_forecast_costPct)
                }
                if (each.namesCommercialMetrics) {
                    each.namesCommercialMetrics = [...new Set(each.namesCommercialMetrics.split('__'))].join(' - ')
                }
                each.hideGlobalAccountDistribution = !Settings.appConfiguration.multiGlobalAccountMode
                each.hideCommercialSpaceAllocation = !Settings.appConfiguration.distributeCostsToSpaces
                each.hideServiceInstanceDistribution = !Settings.appConfiguration.serviceInstancesCreationList.includes(each.serviceId!)
                each.hideServiceApplicationDistribution = !Settings.appConfiguration.serviceInstanceApplicationsCreationList.includes(each.serviceId!)
            })
        })


        /**
         * Handlers for CommercialMetrics
         */
        this.before('READ', CommercialMetrics, async req => {
            // Get and store user access context for use in AFTER handler
            const context = await getUserAccessContext(req)
            requestContextMap.set(req, context)

            addRequiredMeasureColumns<CommercialMetric>(req.query, 'cmByCustomer', ['max_cost', 'measure_cost', 'forecast_cost', 'forecastPct'])
            addSortMeasureColumns<CommercialMetric>(req.query, 'cmByGlobalAccount', 'measure_usage', true)
            addSortMeasureColumns<CommercialMetric>(req.query, 'cmByDirectory', 'measure_cost', true)
            addSortMeasureColumns<CommercialMetric>(req.query, 'cmBySubAccount', 'measure_cost', true)
        })
        this.after('READ', CommercialMetrics, (items, req) => {
            // Get user access context from BEFORE handler
            const context = requestContextMap.get(req)

            // Authorization: Filter out metrics with no accessible measures
            if (context && !context.isUnrestricted && Array.isArray(items)) {
                const indicesToRemove: number[] = []
                items.forEach((each, index) => {
                    const hasAccess = filterNestedMeasures(each, context.allowedIds)
                    if (!hasAccess) {
                        indicesToRemove.push(index)
                    }
                })
                for (let i = indicesToRemove.length - 1; i >= 0; i--) {
                    items.splice(indicesToRemove[i], 1)
                }
                info(`Authorization: Filtered CommercialMetrics from ${items.length + indicesToRemove.length} to ${items.length} metrics`)
            }

            items?.forEach(each => {
                const measure = (each as CommercialMetric).cmByCustomer
                if (measure) {
                    addBulletChartValues(measure)
                    measure.forecastPctCriticality = getForecastCriticality(measure.forecastPct)
                    measure.deltaActualsCriticality = getDeltaCriticality(measure.delta_measure_costPct)
                    measure.deltaForecastCriticality = getDeltaCriticality(measure.delta_forecast_costPct)
                }
                each.tagStrings = each.tags ? formatTags(each.tags) : '(none)'
                each.hideGlobalAccountDistribution = !Settings.appConfiguration.multiGlobalAccountMode
                each.hideCommercialSpaceAllocation = !Settings.appConfiguration.distributeCostsToSpaces
                each.hideServiceInstanceDistribution = !Settings.appConfiguration.serviceInstancesCreationList.includes(each.toService_serviceId!)
                each.hideServiceApplicationDistribution = !Settings.appConfiguration.serviceInstanceApplicationsCreationList.includes(each.toService_serviceId!)

                if ('technicalMetricForAllocation' in each && each.technicalMetricForAllocation == null) {
                    // Create virtual entry to show text so there is a button for the user
                    each.technicalMetricForAllocation = { metricName: '(not allocated)' }
                }
            })
        })

        /**
         * Authorization: Filter CommercialMeasures direct queries by user access
         */
        this.before('READ', 'CommercialMeasures', async req => {
            const context = await getUserAccessContext(req)
            if (!context.isUnrestricted) {
                if (context.allowedIds.length === 0) {
                    addInFilter(req.query, 'id', ['__NO_ACCESS__'])
                } else {
                    addInFilter(req.query, 'id', context.allowedIds)
                }
                info(`Authorization: Filtering CommercialMeasures to ${context.allowedIds.length} accessible IDs`)
            }
        })

        /**
         * Handlers for TechnicalMetrics
         */
        this.before('READ', TechnicalMetrics, async req => {
            // Get and store user access context for use in AFTER handler
            const context = await getUserAccessContext(req)
            requestContextMap.set(req, context)

            addRequiredColumns<TechnicalMetric>(req.query, ['tags'])
            addSortMeasureColumns<TechnicalMetric>(req.query, 'tmByGlobalAccount', 'measure_usage', true)
            addSortMeasureColumns<TechnicalMetric>(req.query, 'tmByDirectory', 'measure_usage', true)
            addSortMeasureColumns<TechnicalMetric>(req.query, 'tmBySubAccount', 'measure_usage', true)
        })
        this.after('READ', TechnicalMetrics, (items, req) => {
            // Get user access context from BEFORE handler
            const context = requestContextMap.get(req)

            // Authorization: Filter out metrics with no accessible measures
            if (context && !context.isUnrestricted && Array.isArray(items)) {
                const indicesToRemove: number[] = []
                items.forEach((each, index) => {
                    const hasAccess = filterNestedMeasures(each, context.allowedIds)
                    if (!hasAccess) {
                        indicesToRemove.push(index)
                    }
                })
                for (let i = indicesToRemove.length - 1; i >= 0; i--) {
                    items.splice(indicesToRemove[i], 1)
                }
                info(`Authorization: Filtered TechnicalMetrics from ${items.length + indicesToRemove.length} to ${items.length} metrics`)
            }

            items?.forEach(each => {
                each.tagStrings = each.tags ? formatTags(each.tags) : '(none)'
                const measure = (each as TechnicalMetric).tmByCustomer
                if (measure) {
                    measure.deltaActualsCriticality = getDeltaCriticality(measure.delta_measure_usagePct)
                }
                each.hideGlobalAccountDistribution = !Settings.appConfiguration.multiGlobalAccountMode
                each.hideServiceInstanceDistribution = !Settings.appConfiguration.serviceInstancesCreationList.includes(each.toService_serviceId!)
                each.hideServiceApplicationDistribution = !Settings.appConfiguration.serviceInstanceApplicationsCreationList.includes(each.toService_serviceId!)
            })
        })

        /**
         * Authorization: Filter TechnicalMeasures direct queries by user access
         */
        this.before('READ', 'TechnicalMeasures', async req => {
            const context = await getUserAccessContext(req)
            if (!context.isUnrestricted) {
                if (context.allowedIds.length === 0) {
                    addInFilter(req.query, 'id', ['__NO_ACCESS__'])
                } else {
                    addInFilter(req.query, 'id', context.allowedIds)
                }
                info(`Authorization: Filtering TechnicalMeasures to ${context.allowedIds.length} accessible IDs`)
            }
        })

        /**
         * Handlers for Work Zone cards
         */
        this.before('READ', Card_HighestForecastServices, async req => {
            // Get and store user access context for use in AFTER handler
            const context = await getUserAccessContext(req)
            requestContextMap.set(req, context)
        })
        this.after('READ', Card_HighestForecastServices, (items, req) => {
            // Get user access context from BEFORE handler
            const context = requestContextMap.get(req)

            // Authorization: Filter out services with no accessible measures
            if (context && !context.isUnrestricted && Array.isArray(items)) {
                const indicesToRemove: number[] = []
                items.forEach((each, index) => {
                    const hasAccess = filterNestedMeasures(each, context.allowedIds)
                    if (!hasAccess) {
                        indicesToRemove.push(index)
                    }
                })
                for (let i = indicesToRemove.length - 1; i >= 0; i--) {
                    items.splice(indicesToRemove[i], 1)
                }
            }

            items?.forEach(each => {
                const measure = (each as BTPService).cmByCustomer
                if (measure) {
                    measure.forecastPctCriticality = getForecastCriticality(measure.forecastPct)
                    measure.deltaActualsCriticality = getDeltaCriticality(measure.delta_measure_costPct)
                }
                if (each.namesCommercialMetrics) {
                    each.namesCommercialMetrics = [...new Set(each.namesCommercialMetrics.split('__'))].join(' - ')
                }
            })
        })

        this.on(proxy_downloadMeasuresForToday, async (req) => {
            //@ts-expect-error
            req.messages = await retrievalService.downloadMeasuresForToday()
        })
        this.on(proxy_downloadMeasuresForPastMonths, async (req) => {
            //@ts-expect-error
            req.messages = await retrievalService.downloadMeasuresForPastMonths({ fromDate: Number(req.data.fromDate) })
        })
        this.on(proxy_deleteAllData, async (req) => req.info(await retrievalService.deleteAllData() as string))
        this.on(proxy_deleteStructureAndTagData, async (req) => req.info(await retrievalService.deleteStructureAndTagData() as string))
        this.on(proxy_resetForecastSettings, async (req) => req.notify(await retrievalService.resetForecastSettings() as string))
        this.on(proxy_resetTechnicalAllocations, async (req) => req.notify(await retrievalService.resetTechnicalAllocations() as string))
        this.on(proxy_calculateCommercialForecasts, async (req) => req.notify(await retrievalService.calculateCommercialForecasts() as string))

        // Received from UI when Bulk Technical Allocations are set
        this.on(SetBulkTechnicalAllocations, async (req) => {
            const { allocations } = req.data

            info(`Setting bulk technical allocations for ${allocations.length} metrics`)

            let totalUpdated = 0
            let totalDeleted = 0

            for (const allocation of allocations) {
                const { serviceId, cMeasureId, tMeasureId, metricName } = allocation

                if (tMeasureId && tMeasureId.trim() !== '') {
                    // Set or update allocation
                    const allocationSetting: AllocationSetting = {
                        serviceId: serviceId!,
                        cMeasureId: cMeasureId!,
                        mode: 'usage', // placeholder to deviate later
                        tServiceId: serviceId, // placeholder to deviate later
                        tMeasureId,
                        metricName
                    }
                    const nbItems = await UPSERT.into(AllocationSettings).entries(allocationSetting)
                    totalUpdated += nbItems
                    info(`Set allocation for service [${serviceId}], metric [${cMeasureId}] to ${tMeasureId}`)
                } else {
                    // Remove allocation
                    const nbItems = await DELETE.from(AllocationSettings, {
                        serviceId,
                        cMeasureId
                    })
                    totalDeleted += nbItems
                    info(`Removed allocation for service [${serviceId}], metric [${cMeasureId}]`)
                }
            }

            const status = `Bulk allocation update completed: ${totalUpdated} records updated, ${totalDeleted} records deleted.`
            info(status)

            req.notify(status)
        })

        // Received from UI when Bulk Forecast Settings are set
        this.on(SetBulkForecastSettings, async (req) => {
            const { settings } = req.data

            info(`Setting bulk forecast settings for ${settings.length} metrics`)

            let totalUpdated = 0

            for (const setting of settings) {
                const { serviceId, cMeasureId, method, degressionFactor } = setting

                info(`Setting forecast config for service [${serviceId}], metric [${cMeasureId}] to ${method} with factor ${degressionFactor}`)

                const forecastSetting: ForecastSetting = {
                    serviceId: serviceId!,
                    measureId: cMeasureId!,
                    method: method as TForecastMethod,
                    degressionFactor: degressionFactor || 1
                }

                const nbItems = await UPSERT.into(ForecastSettings).entries(forecastSetting)
                totalUpdated += nbItems
            }

            const status = `Bulk forecast update completed: ${totalUpdated} records updated.`
            info(status)

            // Trigger a recalculation of the forecasts for all affected services
            const uniqueServiceIds = [...new Set(settings.map(s => s.serviceId))]
            for (const serviceId of uniqueServiceIds) {
                await retrievalService.calculateCommercialForecastsForService({ serviceId })
            }

            req.notify(status)
        })

        // Received from UI when Forecast Settings are changed
        this.on(CommercialMetric.actions.SetForecastSetting, async (req) => {
            const serviceId = (req.params[0] as BTPService).serviceId
            const measureId = (req.params[1] as CommercialMetric).measureId
            const { method, degressionFactor } = req.data

            info(`Setting forecast config for service [${serviceId}], metric [${measureId}] to ${method} with factor ${degressionFactor}`)

            const forecastSetting: ForecastSetting = {
                serviceId,
                measureId,
                method: method as TForecastMethod,
                degressionFactor
            }
            const nbItems = await UPSERT.into(ForecastSettings).entries(forecastSetting)
            const status = `${nbItems} records updated in the database.`
            info(status)

            // Trigger a recalculation of the forecasts for this Service            
            await retrievalService.calculateCommercialForecastsForService({ serviceId })
        })

        // Received from UI when Allocation Settings are changed
        this.on(CommercialMetric.actions.SetTechnicalMetricForAllocation, async (req) => {
            const serviceId = (req.params[0] as BTPService).serviceId
            const cMeasureId = (req.params[1] as CommercialMetric).measureId
            const { tMeasureId, metricName } = req.data

            let nbItems = 0
            if (tMeasureId) {
                info(`Setting technical allocation for service [${serviceId}], metric [${cMeasureId}] to ${tMeasureId}`)
                const allocationSetting: AllocationSetting = {
                    serviceId,
                    cMeasureId,
                    mode: 'usage',// placeholder to deviate later
                    tServiceId: serviceId, // placeholder to deviate later
                    tMeasureId,
                    metricName
                }
                nbItems = await UPSERT.into(AllocationSettings).entries(allocationSetting)
            } else {
                info(`Removing technical allocation for service [${serviceId}], metric [${cMeasureId}]`)
                nbItems = await DELETE.from(AllocationSettings, {
                    serviceId,
                    cMeasureId
                })
            }

            const status = `${nbItems} records updated in the database.`
            info(status)
        })

        this.on(BTPService.actions.deleteBTPService, async req => {
            const item = req.params.slice(-1)[0] as BTPService
            await DELETE(BTPServices, item)
            await retrievalService.calculateCommercialForecastsForService({ serviceId: item.serviceId })
        })
        this.on(CommercialMetric.actions.deleteCommercialMetric, async req => {
            const item = req.params.slice(-1)[0] as CommercialMetric
            await DELETE(CommercialMetrics, item)
            await retrievalService.calculateCommercialForecastsForService({ serviceId: item.toService_serviceId })
        })
        this.on(TechnicalMetric.actions.deleteTechnicalMetric, async req => {
            const item = req.params.slice(-1)[0] as TechnicalMetric
            await DELETE(TechnicalMetrics, item)
        })

        this.on(getLatestBTPAccountMeasure, async req => {
            const data = await SELECT.one
                .from(AggregatedCommercialMeasures)
                .where({
                    interval: TInterval.Daily,
                    level: TAggregationLevel.Customer
                })
                .orderBy('retrieved desc')
            if (data) data.reportYearMonth = reportYearMonthToText(data.reportYearMonth!)
            return data
        })

        // Received from Work Zone to display Tile information
        this.on(getTileInfo, async (req) => {
            const thisMonth = dateToYearMonth()
            const info = await SELECT.one
                .from(AggregatedCommercialMeasures)
                .where({
                    interval: TInterval.Daily,
                    level: TAggregationLevel.Customer
                })
                .orderBy('retrieved desc')
            const tile: TDynamicAppLauncher = {
                title: 'BTP Resource Consumption',
                subtitle: 'Report',
                icon: 'sap-icon://money-bills',
                info: '',
                infoState: '',
                number: info?.forecast_cost || 0,
                numberDigits: 2,
                numberFactor: '',
                numberState: 'Neutral',
                numberUnit: `${reportYearMonthToText(thisMonth)} forecast`,
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
 * @param entity id of the expand which needs to be have the additional columns
 * @param requiredColumns columns to add (if not in the expand already)
 * @example
 *      refColumns sample:
 *          [
 *              { ref: ['toService_serviceId'] },
 *              { ref: ['measureId'] },
 *              { ref: ['level'] },
 *              { ref: ['id'] },
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
        max: Number(measure.measure_cost),
        value: Number(measure.measure_cost),
        target: Number(measure.measure_cost),
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
        const evaluatedProperty = Number(measure.forecast_cost)
        if (evaluatedProperty <= warningLevel) chart.criticality = statusMap.Good
        else if (evaluatedProperty <= errorLevel) chart.criticality = statusMap.Warning
        else chart.criticality = statusMap.Error
    }

    // Store the calculated values in the measure
    Object.assign(measure, flattenObject({ costChart: chart }))
}

/**
 * Calculate the criticality value for the a delta measure
 * @param value value that will be compared to thresholds
 */
function getForecastCriticality(value?: number | null): number {
    let criticality = statusMap.Neutral
    if (value) {
        if (value <= multipliers.Normal) criticality = statusMap.Good
        else if (value <= multipliers.WarningMax) criticality = statusMap.Warning
        else criticality = statusMap.Error
    }
    return criticality
}

/**
 * Calculate the criticality value for the a delta measure
 * @param value value that will be compared to thresholds
 */
function getDeltaCriticality(value?: number | null): number {
    let criticality = statusMap.Neutral
    if (value) {
        if (value <= deltaThresholds.Normal) criticality = statusMap.Good
        else if (value <= deltaThresholds.WarningMax) criticality = statusMap.Warning
        else criticality = statusMap.Error
    }
    return criticality
}

/**
 * Filter nested measure arrays in BTPServices, CommercialMetrics, TechnicalMetrics
 * to only include measures for accessible AccountStructureItems.
 *
 * The cmByLevel and tmByLevel associations contain arrays of measures where
 * each measure has an 'id' field that corresponds to an AccountStructureItem.ID
 *
 * @param item The service/metric item containing nested measure associations
 * @param allowedIds Array of accessible AccountStructureItem IDs
 * @returns true if the item has at least one accessible measure, false otherwise
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function filterNestedMeasures(item: any, allowedIds: string[]): boolean {
    // List of all measure association field names that need filtering
    const measureFields = [
        // Commercial measure associations
        'cmByCustomer', 'cmByGlobalAccount', 'cmByDirectory', 'cmBySubAccount',
        'cmByDatacenter', 'cmBySpace', 'cmByInstance', 'cmByApplication',
        'cmByMetricByGlobalAccount', 'cmByMetricByDirectory', 'cmByMetricBySubAccount',
        'cmByMetricByDatacenter', 'cmByMetricBySpace', 'cmByMetricByInstance', 'cmByMetricByApplication',
        // Technical measure associations
        'tmByCustomer', 'tmByGlobalAccount', 'tmByDirectory', 'tmBySubAccount',
        'tmByDatacenter', 'tmBySpace', 'tmByInstance', 'tmByApplication',
        'tmByMetricByGlobalAccount', 'tmByMetricByDirectory', 'tmByMetricBySubAccount',
        'tmByMetricByDatacenter', 'tmByMetricBySpace', 'tmByMetricByInstance', 'tmByMetricByApplication'
    ]

    let hasAccessibleMeasures = false

    for (const field of measureFields) {
        const value = item[field]
        if (value === undefined || value === null) continue

        if (Array.isArray(value)) {
            // Filter array of measures
            const filtered = value.filter((measure: Record<string, unknown>) => {
                const id = measure.id
                return typeof id === 'string' && allowedIds.includes(id)
            })
            item[field] = filtered
            if (filtered.length > 0) {
                hasAccessibleMeasures = true
            }
        } else if (typeof value === 'object') {
            // Single measure object (e.g., cmByCustomer which has [1 : level = 'Customer'])
            const measure = value as Record<string, unknown>
            const id = measure.id
            if (typeof id === 'string' && !allowedIds.includes(id)) {
                // User doesn't have access to this measure, clear it
                item[field] = null
            } else if (typeof id === 'string') {
                hasAccessibleMeasures = true
            }
        }
    }

    return hasAccessibleMeasures
}

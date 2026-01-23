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
    addInFilter,
    getAccessibleServiceKeys,
    getAccessibleServiceIds,
    addServiceKeyFilter
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
    Card_HistoricTrends,
    Card_TodaysMeasuresByLevels,
    proxy_deleteStructureAndTagData,
    BulkTechnicalAllocations,
    BulkForecastSettings
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
            }
        })

        /**
         * Handlers for BTPServices
         */
        this.before('READ', BTPServices, async req => {
            // Get and store user access context for use in AFTER handler
            const context = await getUserAccessContext(req)
            requestContextMap.set(req, context)

            // Authorization: Filter services that have accessible measures
            if (!context.isUnrestricted) {
                const accessibleKeys = await getAccessibleServiceKeys(context.allowedIds)
                addServiceKeyFilter(req.query, accessibleKeys)

                // For restricted users: Switch from Customer-level to SubAccount-level measures
                // Customer-level measures aggregate ALL subaccounts (unauthorized data exposure)
                switchCustomerToSubAccountExpand(req.query, 'cmByCustomer', 'cmBySubAccount')
                switchCustomerToSubAccountExpand(req.query, 'tmByCustomer', 'tmBySubAccount')
            }

            // Add required columns based on user access level
            if (context.isUnrestricted) {
                addRequiredMeasureColumns<BTPService>(req.query, 'cmByCustomer', ['max_cost', 'measure_cost', 'forecast_cost', 'forecastPct'])
            } else {
                addRequiredMeasureColumns<BTPService>(req.query, 'cmBySubAccount', ['max_cost', 'measure_cost', 'forecast_cost', 'forecastPct'])
            }
            addSortMeasureColumns<BTPService>(req.query, 'cmByGlobalAccount', 'measure_usage', true)
            addSortMeasureColumns<BTPService>(req.query, 'cmByDirectory', 'measure_cost', true)
            addSortMeasureColumns<BTPService>(req.query, 'cmBySubAccount', 'measure_cost', true)
        })
        this.after('READ', BTPServices, async (items, req) => {
            // Get user access context from BEFORE handler
            const context = requestContextMap.get(req)

            // Authorization: Filter out services with no accessible measures
            if (context && !context.isUnrestricted && Array.isArray(items)) {
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
            }

            // For restricted users: Query SubAccount-level measures and aggregate them for cmByCustomer
            if (context && !context.isUnrestricted && Array.isArray(items)) {
                for (const each of items) {
                    const btpService = each as BTPService

                    // If cmBySubAccount is empty/missing and cmByCustomer is also empty,
                    // query the SubAccount-level measures directly
                    let subAccountMeasures = btpService.cmBySubAccount

                    if ((!subAccountMeasures || (Array.isArray(subAccountMeasures) && subAccountMeasures.length === 0)) && !btpService.cmByCustomer) {
                        // Query SubAccount-level measures directly and filter to allowed IDs
                        try {
                            const allSubAccountMeasures = await SELECT.from('db.CommercialMeasures')
                                .where({
                                    toMetric_toService_reportYearMonth: btpService.reportYearMonth,
                                    toMetric_toService_serviceId: btpService.serviceId,
                                    toMetric_toService_retrieved: btpService.retrieved,
                                    toMetric_toService_interval: btpService.interval,
                                    toMetric_measureId: '_combined_',
                                    level: 'Sub Account'
                                })

                            // Filter to only allowed IDs
                            const measures = allSubAccountMeasures.filter((m: any) => context.allowedIds.includes(m.id))

                            if (measures.length > 0) {
                                subAccountMeasures = measures
                                btpService.cmBySubAccount = measures
                            }
                        } catch (err) {
                            // Silently ignore errors - service will just not have measure data
                        }
                    }

                    // Aggregate the SubAccount measures into cmByCustomer for UI compatibility
                    if (subAccountMeasures && !btpService.cmByCustomer) {
                        if (Array.isArray(subAccountMeasures) && subAccountMeasures.length > 0) {
                            btpService.cmByCustomer = aggregateCommercialMeasures(subAccountMeasures)
                        } else if (!Array.isArray(subAccountMeasures)) {
                            btpService.cmByCustomer = subAccountMeasures
                        }
                    }
                }
            }

            items?.forEach(each => {
                const btpService = each as BTPService

                const measure = btpService.cmByCustomer
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

            // Authorization: Filter metrics that have accessible measures
            if (!context.isUnrestricted) {
                const accessibleKeys = await getAccessibleServiceKeys(context.allowedIds)
                addServiceKeyFilter(req.query, accessibleKeys, 'toService_')

                // For restricted users: Switch from Customer-level to SubAccount-level measures
                switchCustomerToSubAccountExpand(req.query, 'cmByCustomer', 'cmBySubAccount')
            }

            // Add required columns based on user access level
            if (context.isUnrestricted) {
                addRequiredMeasureColumns<CommercialMetric>(req.query, 'cmByCustomer', ['max_cost', 'measure_cost', 'forecast_cost', 'forecastPct'])
            } else {
                addRequiredMeasureColumns<CommercialMetric>(req.query, 'cmBySubAccount', ['max_cost', 'measure_cost', 'forecast_cost', 'forecastPct'])
            }
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
            }

            items?.forEach(each => {
                const metric = each as CommercialMetric

                // For restricted users: Map cmBySubAccount to cmByCustomer for UI compatibility
                // We aggregate all accessible subaccount measures to show the total across the user's scope
                if (context && !context.isUnrestricted) {
                    const subAccountMeasures = metric.cmBySubAccount
                    if (subAccountMeasures && !metric.cmByCustomer) {
                        if (Array.isArray(subAccountMeasures) && subAccountMeasures.length > 0) {
                            // Aggregate all accessible subaccount measures into a single total
                            metric.cmByCustomer = aggregateCommercialMeasures(subAccountMeasures)
                        } else if (!Array.isArray(subAccountMeasures)) {
                            metric.cmByCustomer = subAccountMeasures
                        }
                    }
                }

                const measure = metric.cmByCustomer
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
         * For restricted users, block aggregated levels (Customer, Directory, GlobalAccount)
         * which contain data from all children including inaccessible subaccounts
         */
        this.before('READ', 'CommercialMeasures', async req => {
            const context = await getUserAccessContext(req)
            if (!context.isUnrestricted) {
                if (context.allowedIds.length === 0) {
                    addInFilter(req.query, 'id', ['__NO_ACCESS__'])
                } else {
                    addInFilter(req.query, 'id', context.allowedIds)
                    // Block aggregated levels - they contain data from all children
                    addInFilter(req.query, 'level', ['Sub Account', 'Space', 'Instance', 'Application', 'Datacenter'])
                }
            }
        })

        /**
         * Handlers for TechnicalMetrics
         */
        this.before('READ', TechnicalMetrics, async req => {
            // Get and store user access context for use in AFTER handler
            const context = await getUserAccessContext(req)
            requestContextMap.set(req, context)

            // Authorization: Filter metrics that have accessible measures
            if (!context.isUnrestricted) {
                const accessibleKeys = await getAccessibleServiceKeys(context.allowedIds)
                addServiceKeyFilter(req.query, accessibleKeys, 'toService_')

                // For restricted users: Switch from Customer-level to SubAccount-level measures
                switchCustomerToSubAccountExpand(req.query, 'tmByCustomer', 'tmBySubAccount')
            }

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
            }

            items?.forEach(each => {
                each.tagStrings = each.tags ? formatTags(each.tags) : '(none)'
                const metric = each as TechnicalMetric

                // For restricted users: Map tmBySubAccount to tmByCustomer for UI compatibility
                // We aggregate all accessible subaccount measures to show the total across the user's scope
                if (context && !context.isUnrestricted) {
                    const subAccountMeasures = metric.tmBySubAccount
                    if (subAccountMeasures && !metric.tmByCustomer) {
                        if (Array.isArray(subAccountMeasures) && subAccountMeasures.length > 0) {
                            // Aggregate all accessible subaccount measures into a single total
                            metric.tmByCustomer = aggregateTechnicalMeasures(subAccountMeasures)
                        } else if (!Array.isArray(subAccountMeasures)) {
                            metric.tmByCustomer = subAccountMeasures
                        }
                    }
                }

                const measure = metric.tmByCustomer
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
         * For restricted users, block aggregated levels (Customer, Directory, GlobalAccount)
         */
        this.before('READ', 'TechnicalMeasures', async req => {
            const context = await getUserAccessContext(req)
            if (!context.isUnrestricted) {
                if (context.allowedIds.length === 0) {
                    addInFilter(req.query, 'id', ['__NO_ACCESS__'])
                } else {
                    addInFilter(req.query, 'id', context.allowedIds)
                    // Block aggregated levels - they contain data from all children
                    addInFilter(req.query, 'level', ['Sub Account', 'Space', 'Instance', 'Application', 'Datacenter'])
                }
            }
        })

        /**
         * Handlers for Work Zone cards
         * Card_HighestForecastServices shows Customer-level aggregated data (cmByCustomer)
         * Block entirely for non-admin users
         */
        this.before('READ', Card_HighestForecastServices, async req => {
            const context = await getUserAccessContext(req)
            if (!context.isUnrestricted) {
                // Block access - this card shows Customer-level aggregated data
                addInFilter(req.query, 'serviceId', ['__NO_ACCESS__'])
            }
        })
        this.after('READ', Card_HighestForecastServices, (items) => {
            items?.forEach(each => {
                const btpService = each as BTPService
                const measure = btpService.cmByCustomer
                if (measure) {
                    measure.forecastPctCriticality = getForecastCriticality(measure.forecastPct)
                    measure.deltaActualsCriticality = getDeltaCriticality(measure.delta_measure_costPct)
                }
                if (each.namesCommercialMetrics) {
                    each.namesCommercialMetrics = [...new Set(each.namesCommercialMetrics.split('__'))].join(' - ')
                }
            })
        })

        /**
         * Authorization: Block Card_HistoricTrends for non-admin users
         * This card shows Customer-level aggregated data (level = 'Customer')
         * which cannot be filtered by subaccount
         */
        this.before('READ', Card_HistoricTrends, async req => {
            const context = await getUserAccessContext(req)
            if (!context.isUnrestricted) {
                // Block access - this card shows Customer-level aggregated data
                addInFilter(req.query, 'id', ['__NO_ACCESS__'])
            }
        })

        /**
         * Authorization: Filter Card_TodaysMeasuresByLevels by user access
         * Uses 'id' field which corresponds to AccountStructureItem.ID
         */
        this.before('READ', Card_TodaysMeasuresByLevels, async req => {
            const context = await getUserAccessContext(req)
            if (!context.isUnrestricted) {
                if (context.allowedIds.length === 0) {
                    addInFilter(req.query, 'id', ['__NO_ACCESS__'])
                } else {
                    addInFilter(req.query, 'id', context.allowedIds)
                }
            }
        })

        /**
         * Authorization: Filter BulkTechnicalAllocations by user access
         * Only show services that have measures in accessible account structure items
         */
        this.before('READ', BulkTechnicalAllocations, async req => {
            const context = await getUserAccessContext(req)
            if (!context.isUnrestricted) {
                const accessibleServiceIds = await getAccessibleServiceIds(context.allowedIds)
                if (accessibleServiceIds.length === 0) {
                    addInFilter(req.query, 'serviceId', ['__NO_ACCESS__'])
                } else {
                    addInFilter(req.query, 'serviceId', accessibleServiceIds)
                }
            }
        })

        /**
         * Authorization: Filter BulkForecastSettings by user access
         * Only show services that have measures in accessible account structure items
         */
        this.before('READ', BulkForecastSettings, async req => {
            const context = await getUserAccessContext(req)
            if (!context.isUnrestricted) {
                const accessibleServiceIds = await getAccessibleServiceIds(context.allowedIds)
                if (accessibleServiceIds.length === 0) {
                    addInFilter(req.query, 'serviceId', ['__NO_ACCESS__'])
                } else {
                    addInFilter(req.query, 'serviceId', accessibleServiceIds)
                }
            }
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
            // Block for non-admin users - this returns Customer-level aggregated data
            const context = await getUserAccessContext(req)
            if (!context.isUnrestricted) {
                return null
            }

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
            const context = await getUserAccessContext(req)

            // For non-admin users, return tile without Customer-level aggregated data
            if (!context.isUnrestricted) {
                const tile: TDynamicAppLauncher = {
                    title: 'BTP Resource Consumption',
                    subtitle: 'Report',
                    icon: 'sap-icon://money-bills',
                    info: '',
                    infoState: '',
                    number: 0,
                    numberDigits: 0,
                    numberFactor: '',
                    numberState: 'Neutral',
                    numberUnit: '',
                    stateArrow: ''
                }
                return tile
            }

            const tileInfo = await SELECT.one
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
                number: tileInfo?.forecast_cost || 0,
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
/**
 * For restricted users, switch from Customer-level expansion to SubAccount-level expansion.
 * Customer-level measures aggregate ALL subaccounts and would expose unauthorized data.
 *
 * NOTE: We don't add a WHERE clause to the expand here because:
 * 1. The CQN WHERE on expand doesn't always work reliably with complex associations
 * 2. The AFTER handler (filterNestedMeasures) will filter the data by allowedIds
 * 3. This ensures consistent filtering regardless of how the data is fetched
 *
 * @param query The CQN query object
 * @param customerEntity The Customer-level entity to replace (e.g., 'cmByCustomer')
 * @param subAccountEntity The SubAccount-level entity to use instead (e.g., 'cmBySubAccount')
 */
function switchCustomerToSubAccountExpand(
    query: Partial<cds.SELECT>,
    customerEntity: string,
    subAccountEntity: string
): void {
    const columns = query.SELECT?.columns
    if (!columns) return

    // Find the Customer-level expand
    const customerExpandIndex = columns.findIndex(c => c.ref?.toString() === customerEntity)

    if (customerExpandIndex >= 0) {
        const customerExpand = columns[customerExpandIndex]

        // Check if SubAccount expand already exists
        let subAccountExpand = columns.find(c => c.ref?.toString() === subAccountEntity)

        if (!subAccountExpand) {
            // Create SubAccount expand with same columns as Customer expand
            // Also add 'id' column which is needed for filtering in AFTER handler
            const expandColumns = customerExpand.expand ? [...customerExpand.expand] : [{ ref: ['*'] }]
            // Ensure 'id' is included for filtering
            if (!expandColumns.some((c: any) => c.ref?.includes('id') || c === '*' || c.ref?.includes('*'))) {
                expandColumns.push({ ref: ['id'] })
            }
            subAccountExpand = {
                ref: [subAccountEntity],
                expand: expandColumns
            }
            columns.push(subAccountExpand)
        }

        // Remove Customer-level expand (it aggregates all subaccounts)
        columns.splice(customerExpandIndex, 1)
    }
}

function addRequiredMeasureColumns<T>(query: Partial<cds.SELECT>, entity: keyof T, requiredColumns: string[]): void {
    const refColumns = query.SELECT?.columns?.find(x => x.ref?.toString() == entity)?.expand
    if (refColumns) {
        for (const requiredColumn of requiredColumns) {
            if (!refColumns.find(expand => typeof expand == 'string' || expand.ref && expand.ref.find(x => x == requiredColumn))) {
                refColumns.push({ ref: [requiredColumn] })
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
    // Customer-level measures aggregate ALL subaccounts, so they must be cleared
    // for restricted users (they contain data from inaccessible subaccounts)
    // Also clear Directory and GlobalAccount levels - they aggregate data from all children,
    // including subaccounts the user doesn't have access to
    const aggregatedLevelFields = [
        'cmByCustomer', 'tmByCustomer',
        'cmByGlobalAccount', 'tmByGlobalAccount',
        'cmByDirectory', 'tmByDirectory',
        'cmByMetricByGlobalAccount', 'tmByMetricByGlobalAccount',
        'cmByMetricByDirectory', 'tmByMetricByDirectory'
    ]

    // Fields that can be filtered by ID - only subaccount and lower levels
    // These represent individual resources where the ID directly corresponds to the accessible item
    const measureFields = [
        // Commercial measure associations (SubAccount and lower levels only)
        'cmBySubAccount',
        'cmByDatacenter', 'cmBySpace', 'cmByInstance', 'cmByApplication',
        'cmByMetricBySubAccount',
        'cmByMetricByDatacenter', 'cmByMetricBySpace', 'cmByMetricByInstance', 'cmByMetricByApplication',
        // Technical measure associations (SubAccount and lower levels only)
        'tmBySubAccount',
        'tmByDatacenter', 'tmBySpace', 'tmByInstance', 'tmByApplication',
        'tmByMetricBySubAccount',
        'tmByMetricByDatacenter', 'tmByMetricBySpace', 'tmByMetricByInstance', 'tmByMetricByApplication'
    ]

    let hasAccessibleMeasures = false

    // Clear aggregated-level measures for restricted users
    // These aggregate data from all children (including inaccessible subaccounts) and can't be filtered
    for (const field of aggregatedLevelFields) {
        if (item[field] !== undefined && item[field] !== null) {
            item[field] = null
        }
    }

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
            // Single measure object
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

    // If service exists in user's accessible services (based on BEFORE filter),
    // consider it accessible even if no sub-measures are expanded
    // This allows showing the service list while measures are loaded via expand
    if (!hasAccessibleMeasures) {
        // Check if the service itself is accessible (serviceId is in an allowed space/instance ID pattern)
        const serviceId = item.serviceId
        if (serviceId) {
            // User's allowedIds contain patterns like 'subaccountId_serviceId'
            // Check if any allowedId ends with the serviceId
            hasAccessibleMeasures = allowedIds.some(id =>
                id.endsWith(`_${serviceId}`) || id.includes(`_${serviceId}_`)
            )
        }
    }

    return hasAccessibleMeasures
}

/**
 * Aggregate multiple CommercialMeasures into a single aggregated measure.
 * This is used for restricted users who have access to multiple subaccounts,
 * so they see the total cost across all their accessible subaccounts.
 *
 * @param measures Array of CommercialMeasure objects to aggregate
 * @returns A single aggregated CommercialMeasure object
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function aggregateCommercialMeasures(measures: any[]): any {
    if (!measures || measures.length === 0) {
        return null
    }
    if (measures.length === 1) {
        return measures[0]
    }

    // Start with a copy of the first measure as base
    const aggregated = { ...measures[0] }

    // Set aggregated identifier
    aggregated.id = '_aggregated_'
    aggregated.name = 'Total (Viewer Scope)'
    aggregated.level = 'Viewer Scope'

    // Fields to sum
    const sumFields = [
        'measure_cost', 'measure_usage', 'measure_actualUsage', 'measure_chargedBlocks',
        'measure_paygCost', 'measure_cloudCreditsCost',
        'forecast_cost', 'forecast_usage', 'forecast_actualUsage', 'forecast_chargedBlocks',
        'delta_measure_cost', 'delta_measure_usage', 'delta_measure_actualUsage', 'delta_measure_chargedBlocks',
        'delta_forecast_cost', 'delta_forecast_usage', 'delta_forecast_actualUsage', 'delta_forecast_chargedBlocks',
        'max_cost'
    ]

    // Initialize sum fields to 0 and sum across all measures
    for (const field of sumFields) {
        aggregated[field] = 0
        for (const measure of measures) {
            const value = measure[field]
            if (value != null) {
                // Handle both number and string values (database may return decimals as strings)
                const numValue = typeof value === 'number' ? value : parseFloat(value)
                if (!isNaN(numValue)) {
                    aggregated[field] += numValue
                }
            }
        }
        // Convert 0 to null if all source values were null
        if (aggregated[field] === 0) {
            const hasAnyValue = measures.some(m => m[field] != null && m[field] !== 0 && m[field] !== '0' && m[field] !== '0.00')
            if (!hasAnyValue) {
                aggregated[field] = null
            }
        }
    }

    // Recalculate percentage fields based on aggregated values
    // forecastPct = forecast_cost / max_cost * 100
    if (aggregated.max_cost && aggregated.max_cost > 0 && aggregated.forecast_cost != null) {
        aggregated.forecastPct = Math.round(aggregated.forecast_cost / aggregated.max_cost * 100)
    } else {
        aggregated.forecastPct = null
    }

    // delta_measure_costPct = delta_measure_cost / (measure_cost - delta_measure_cost) * 100
    if (aggregated.measure_cost != null && aggregated.delta_measure_cost != null) {
        const previousCost = aggregated.measure_cost - aggregated.delta_measure_cost
        if (previousCost !== 0) {
            aggregated.delta_measure_costPct = Math.round(aggregated.delta_measure_cost / previousCost * 100)
        } else {
            aggregated.delta_measure_costPct = null
        }
    }

    // delta_measure_usagePct
    if (aggregated.measure_usage != null && aggregated.delta_measure_usage != null) {
        const previousUsage = aggregated.measure_usage - aggregated.delta_measure_usage
        if (previousUsage !== 0) {
            aggregated.delta_measure_usagePct = Math.round(aggregated.delta_measure_usage / previousUsage * 100)
        } else {
            aggregated.delta_measure_usagePct = null
        }
    }

    // delta_forecast_costPct
    if (aggregated.forecast_cost != null && aggregated.delta_forecast_cost != null) {
        const previousForecast = aggregated.forecast_cost - aggregated.delta_forecast_cost
        if (previousForecast !== 0) {
            aggregated.delta_forecast_costPct = Math.round(aggregated.delta_forecast_cost / previousForecast * 100)
        } else {
            aggregated.delta_forecast_costPct = null
        }
    }

    // delta_forecast_usagePct
    if (aggregated.forecast_usage != null && aggregated.delta_forecast_usage != null) {
        const previousForecastUsage = aggregated.forecast_usage - aggregated.delta_forecast_usage
        if (previousForecastUsage !== 0) {
            aggregated.delta_forecast_usagePct = Math.round(aggregated.delta_forecast_usage / previousForecastUsage * 100)
        } else {
            aggregated.delta_forecast_usagePct = null
        }
    }

    return aggregated
}

/**
 * Aggregate multiple TechnicalMeasures into a single aggregated measure.
 * This is used for restricted users who have access to multiple subaccounts,
 * so they see the total usage across all their accessible subaccounts.
 *
 * @param measures Array of TechnicalMeasure objects to aggregate
 * @returns A single aggregated TechnicalMeasure object
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function aggregateTechnicalMeasures(measures: any[]): any {
    if (!measures || measures.length === 0) return null
    if (measures.length === 1) return measures[0]

    // Start with a copy of the first measure as base
    const aggregated = { ...measures[0] }

    // Set aggregated identifier
    aggregated.id = '_aggregated_'
    aggregated.name = 'Total (Viewer Scope)'
    aggregated.level = 'Viewer Scope'

    // Fields to sum
    const sumFields = ['measure_usage', 'delta_measure_usage']

    // Initialize sum fields to 0 and sum across all measures
    for (const field of sumFields) {
        aggregated[field] = 0
        for (const measure of measures) {
            const value = measure[field]
            if (value != null) {
                // Handle both number and string values (database may return decimals as strings)
                const numValue = typeof value === 'number' ? value : parseFloat(value)
                if (!isNaN(numValue)) {
                    aggregated[field] += numValue
                }
            }
        }
        // Convert 0 to null if all source values were null
        if (aggregated[field] === 0) {
            const hasAnyValue = measures.some(m => m[field] != null && m[field] !== 0 && m[field] !== '0' && m[field] !== '0.00')
            if (!hasAnyValue) {
                aggregated[field] = null
            }
        }
    }

    // Recalculate percentage fields based on aggregated values
    // delta_measure_usagePct = delta_measure_usage / (measure_usage - delta_measure_usage) * 100
    if (aggregated.measure_usage != null && aggregated.delta_measure_usage != null) {
        const previousUsage = aggregated.measure_usage - aggregated.delta_measure_usage
        if (previousUsage !== 0) {
            aggregated.delta_measure_usagePct = Math.round(aggregated.delta_measure_usage / previousUsage * 100)
        } else {
            aggregated.delta_measure_usagePct = null
        }
    }

    return aggregated
}

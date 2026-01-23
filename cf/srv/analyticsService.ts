import cds from '@sap/cds'

import { addRequiredColumns } from './functions'
import { getUserAccessContext, addInFilter, getSubAccountLevelIds } from './authorizationHelper'

import {
    CommercialMeasure,
    CommercialMeasures,
    CommercialMeasuresByTags,
    CommercialMeasuresByTagsWInheritances,
    CommercialMeasuresForYears,
    CommercialMeasuresForYearByTags,
    CommercialMeasuresForYearByTagsWInheritances,
    CloudCreditConsumptions,
    CombinedTags
} from '#cds-models/AnalyticsService'

export default class AnalyticsService extends cds.ApplicationService {
    async init() {

        /**
         * Authorization: Filter AccountStructureItems by user access
         */
        this.before('READ', 'AccountStructureItems', async req => {
            const context = await getUserAccessContext(req)
            if (!context.isUnrestricted) {
                if (context.allowedIds.length === 0) {
                    addInFilter(req.query, 'ID', ['__NO_ACCESS__'])
                } else {
                    addInFilter(req.query, 'ID', context.allowedIds)
                }
            }
        })

        /**
         * Authorization: Filter AggregatedCommercialMeasures by user access
         * Uses 'id' field which corresponds to AccountStructureItem.ID
         * For restricted users, only show SubAccount level and below
         */
        this.before('READ', 'AggregatedCommercialMeasures', async req => {
            const context = await getUserAccessContext(req)
            if (!context.isUnrestricted) {
                if (context.allowedIds.length === 0) {
                    addInFilter(req.query, 'id', ['__NO_ACCESS__'])
                } else {
                    const subAccountLevelIds = await getSubAccountLevelIds(context.allowedIds)
                    addInFilter(req.query, 'id', subAccountLevelIds.length > 0 ? subAccountLevelIds : ['__NO_ACCESS__'])
                }
            }
        })

        /**
         * Authorization: Filter CommercialMeasures by user access
         * Uses 'AccountStructureItem_ID' field
         * For restricted users, only show SubAccount level and below (not Directory/GlobalAccount
         * which contain aggregated data from all children including inaccessible subaccounts)
         */
        this.before('READ', CommercialMeasures, async req => {
            const context = await getUserAccessContext(req)
            if (!context.isUnrestricted) {
                if (context.allowedIds.length === 0) {
                    addInFilter(req.query, 'AccountStructureItem_ID', ['__NO_ACCESS__'])
                } else {
                    // Filter to only SubAccount level and below to exclude aggregated parent levels
                    const subAccountLevelIds = await getSubAccountLevelIds(context.allowedIds)
                    addInFilter(req.query, 'AccountStructureItem_ID', subAccountLevelIds.length > 0 ? subAccountLevelIds : ['__NO_ACCESS__'])
                }
            }
        })

        /**
         * Authorization: Filter CommercialMeasuresByTags by user access
         */
        this.before('READ', CommercialMeasuresByTags, async req => {
            const context = await getUserAccessContext(req)
            if (!context.isUnrestricted) {
                if (context.allowedIds.length === 0) {
                    addInFilter(req.query, 'AccountStructureItem_ID', ['__NO_ACCESS__'])
                } else {
                    const subAccountLevelIds = await getSubAccountLevelIds(context.allowedIds)
                    addInFilter(req.query, 'AccountStructureItem_ID', subAccountLevelIds.length > 0 ? subAccountLevelIds : ['__NO_ACCESS__'])
                }
            }
        })

        /**
         * Authorization: Filter CommercialMeasuresForYears by user access
         */
        this.before('READ', CommercialMeasuresForYears, async req => {
            const context = await getUserAccessContext(req)
            if (!context.isUnrestricted) {
                if (context.allowedIds.length === 0) {
                    addInFilter(req.query, 'AccountStructureItem_ID', ['__NO_ACCESS__'])
                } else {
                    const subAccountLevelIds = await getSubAccountLevelIds(context.allowedIds)
                    addInFilter(req.query, 'AccountStructureItem_ID', subAccountLevelIds.length > 0 ? subAccountLevelIds : ['__NO_ACCESS__'])
                }
            }
        })

        /**
         * Authorization: Filter CommercialMeasuresForYearByTags by user access
         */
        this.before('READ', CommercialMeasuresForYearByTags, async req => {
            const context = await getUserAccessContext(req)
            if (!context.isUnrestricted) {
                if (context.allowedIds.length === 0) {
                    addInFilter(req.query, 'AccountStructureItem_ID', ['__NO_ACCESS__'])
                } else {
                    const subAccountLevelIds = await getSubAccountLevelIds(context.allowedIds)
                    addInFilter(req.query, 'AccountStructureItem_ID', subAccountLevelIds.length > 0 ? subAccountLevelIds : ['__NO_ACCESS__'])
                }
            }
        })

        /**
         * Authorization: Filter CommercialMeasuresByTagsWInheritances by user access
         */
        this.before('READ', CommercialMeasuresByTagsWInheritances, async req => {
            const context = await getUserAccessContext(req)
            if (!context.isUnrestricted) {
                if (context.allowedIds.length === 0) {
                    addInFilter(req.query, 'AccountStructureItem_ID', ['__NO_ACCESS__'])
                } else {
                    const subAccountLevelIds = await getSubAccountLevelIds(context.allowedIds)
                    addInFilter(req.query, 'AccountStructureItem_ID', subAccountLevelIds.length > 0 ? subAccountLevelIds : ['__NO_ACCESS__'])
                }
            }
        })

        /**
         * Authorization: Filter CommercialMeasuresForYearByTagsWInheritances by user access
         */
        this.before('READ', CommercialMeasuresForYearByTagsWInheritances, async req => {
            const context = await getUserAccessContext(req)
            if (!context.isUnrestricted) {
                if (context.allowedIds.length === 0) {
                    addInFilter(req.query, 'AccountStructureItem_ID', ['__NO_ACCESS__'])
                } else {
                    const subAccountLevelIds = await getSubAccountLevelIds(context.allowedIds)
                    addInFilter(req.query, 'AccountStructureItem_ID', subAccountLevelIds.length > 0 ? subAccountLevelIds : ['__NO_ACCESS__'])
                }
            }
        })

        /**
         * Authorization: Filter CloudCreditConsumptions by user access
         * Uses 'globalAccountId' field which corresponds to AccountStructureItem.ID
         */
        this.before('READ', CloudCreditConsumptions, async req => {
            const context = await getUserAccessContext(req)
            if (!context.isUnrestricted) {
                if (context.allowedIds.length === 0) {
                    addInFilter(req.query, 'globalAccountId', ['__NO_ACCESS__'])
                } else {
                    addInFilter(req.query, 'globalAccountId', context.allowedIds)
                }
            }
        })

        /**
         * Authorization: Filter CombinedTags by user access
         * Uses 'toAccountStructureItem_ID' field which corresponds to AccountStructureItem.ID
         */
        this.before('READ', CombinedTags, async req => {
            const context = await getUserAccessContext(req)
            if (!context.isUnrestricted) {
                if (context.allowedIds.length === 0) {
                    addInFilter(req.query, 'toAccountStructureItem_ID', ['__NO_ACCESS__'])
                } else {
                    addInFilter(req.query, 'toAccountStructureItem_ID', context.allowedIds)
                }
            }
        })

        const deltaColumns: (keyof CommercialMeasure)[] = [
            'Measures_delta_measure_cost',
            'Measures_delta_measure_usage',
            'Measures_delta_measure_actualUsage',
            'Measures_delta_measure_chargedBlocks',
            'Measures_delta_forecast_cost',
            'Measures_delta_forecast_usage',
            'Measures_delta_forecast_actualUsage',
            'Measures_delta_forecast_chargedBlocks'
        ]
        const deltaPercentColumns: (keyof CommercialMeasure)[] = [
            'Measures_delta_measure_costPct',
            'Measures_delta_measure_usagePct',
            'Measures_delta_measure_actualUsagePct',
            'Measures_delta_measure_chargedBlocksPct',
            'Measures_delta_forecast_costPct',
            'Measures_delta_forecast_usagePct',
            'Measures_delta_forecast_actualUsagePct',
            'Measures_delta_forecast_chargedBlocksPct'
        ]

        this.after('READ', CommercialMeasures, items => {
            items?.forEach(each => {
                if (each.Measures_currency) {
                    //@ts-expect-error
                    deltaColumns.forEach(c => each[c] ??= 0)
                    //@ts-expect-error
                    deltaPercentColumns.forEach(c => each[c] &&= Number(each[c]))
                }
            })
        })

        this.before('READ', CommercialMeasuresByTags, req => {
            //@ts-expect-error
            addRequiredColumns<CommercialMeasuresByTags>(req.query, ['Tag_pct'], 'Tag_label')
        })
        this.after('READ', CommercialMeasuresByTags, items => {
            items?.forEach(each => {
                if (each.Measures_currency && (each.Tag_label || each.Tag_pct)) {
                    //@ts-expect-error
                    deltaColumns.forEach(c => each[c] ??= 0)
                    //@ts-expect-error
                    deltaPercentColumns.forEach(c => { each[c] &&= Number(each[c]) })
                } else {
                    each.Measures_currency = null
                }
            })
        })

        this.after('READ', CommercialMeasuresForYears, items => {
            items?.forEach(each => {
                if (each.Measures_currency) {
                    for (let i = 1; i <= 12; i++) {
                        const month = i.toString().padStart(2, '0')
                        //@ts-expect-error
                        each[`Measures_measure_cost_${month}`] ??= 0
                        //@ts-expect-error
                        each[`Measures_delta_measure_cost_${month}`] ??= 0
                        //@ts-expect-error
                        each[`Measures_delta_measure_costPct_${month}`] &&= Number(each[`Measures_delta_measure_costPct_${month}`])
                    }
                }
                if (each.Measures_serviceNames) {
                    const uniqueNames = [...new Set(each.Measures_serviceNames.split('__').sort((a, b) => a > b ? 1 : -1))]
                    each.Measures_serviceNames = uniqueNames.join('__')
                    each.Measures_countServices = uniqueNames.length
                }
            })
        })

        this.before('READ', CommercialMeasuresForYearByTags, req => {
            //@ts-expect-error
            addRequiredColumns<CommercialMeasuresForYearByTags>(req.query, ['Tag_pct'], 'Tag_label')
        })
        this.after('READ', CommercialMeasuresForYearByTags, items => {
            items?.forEach(each => {
                if (each.Measures_currency && (each.Tag_label || each.Tag_pct)) {
                    for (let i = 1; i <= 12; i++) {
                        const month = i.toString().padStart(2, '0')
                        //@ts-expect-error
                        each[`Measures_measure_cost_${month}`] ??= 0
                        //@ts-expect-error
                        each[`Measures_delta_measure_cost_${month}`] ??= 0
                        //@ts-expect-error
                        each[`Measures_delta_measure_costPct_${month}`] &&= Number(each[`Measures_delta_measure_costPct_${month}`])
                    }
                } else {
                    each.Measures_currency = null
                }
            })
        })

        // this.on(getSACStoryUrl, req => {
        //     return { url: process.env.SAC_story || 'No URL set.' }
        // })

        return super.init()
    }
}

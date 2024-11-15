import cds from '@sap/cds'

import { Settings } from './settings'
import { addRequiredColumns } from './functions'

import {
    CommercialMeasure,
    CommercialMeasures,
    CommercialMeasuresByTags,
    CommercialMeasuresForYears,
    CommercialMeasuresForYearByTags
} from '#cds-models/AnalyticsService'

const info = cds.log('analyticsService').info

export default class AnalyticsService extends cds.ApplicationService {
    async init() {

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

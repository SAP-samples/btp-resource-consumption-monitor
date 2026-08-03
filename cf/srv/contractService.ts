import cds from '@sap/cds'

import { Settings } from './settings'
import {
    BillingDifferences,
    BillingResolutions,
    Card_CreditBurnDownHeaders,
    Card_CreditBurnDowns
} from '#cds-models/ContractsService'

import {
    reportYearMonthToText,
    reportYearMonthToTextShort
} from './functions'

const info = cds.log('contractsService').info

export default class ContractsService extends cds.ApplicationService {
    async init() {

        this.after('READ', BillingDifferences, items => {
            items?.forEach(each => {
                each.reportYearMonthRaw = each.reportYearMonth  // preserve raw key before display transformation
                each.reportYearMonth = reportYearMonthToText(each.reportYearMonth!)
                if ((each.Billing_difference ?? 0) > Settings.appConfiguration.billingVerification.allowedDifferenceThreshold) {
                    each.status = 'Discrepancy'
                    each.criticality = 2
                } else if ((each.Billing_difference ?? 0) < -Settings.appConfiguration.billingVerification.allowedDifferenceThreshold) {
                    each.status = 'Reduced Charge'
                    each.criticality = 5
                } else {
                    each.status = 'Aligned'
                    each.criticality = 3
                }
                each.rowHighlight = each.criticality  // default: same as criticality
                if (each.Resolution_resolved) {
                    each.status = 'Discrepancy - Resolved'
                    each.criticality = 0  // distinct from Aligned (3); used for button visibility
                    each.rowHighlight = 3  // green row highlight, same as Aligned
                }
            })
        })

        // Upsert handler: update existing resolution or create a new one
        this.on('CREATE', BillingResolutions, async (req) => {
            const { reportYearMonth, AccountStructureItem_ID, comment, resolved } = req.data
            await UPSERT.into('BillingResolutions').entries({
                reportYearMonth,
                AccountStructureItem_ID,
                comment,
                resolved
            })
            return req.data
        })

        this.after('READ', Card_CreditBurnDowns, items => {
            items?.forEach(each => {
                each.month = reportYearMonthToTextShort(each.reportYearMonth!)
            })
        })

        this.after('READ', Card_CreditBurnDownHeaders, items => {
            items?.forEach(each => {
                each.month = reportYearMonthToTextShort(each.reportYearMonth!)
            })
        })

        return super.init()
    }
}



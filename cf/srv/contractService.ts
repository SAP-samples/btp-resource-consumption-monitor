import cds from '@sap/cds'

import { Settings } from './settings'
import {
    BillingDifferences,
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
            })
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



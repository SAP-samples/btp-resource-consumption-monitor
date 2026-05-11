import cds from '@sap/cds'

import { Settings } from './settings'
import { createAdminOnlyFilter } from './authorizationHelper'
import {
    BillingDifferences,
    Card_CreditBurnDownHeaders,
    Card_CreditBurnDowns
} from '#cds-models/ContractService'
import {
    reportYearMonthToText,
    reportYearMonthToTextShort
} from './functions'

export default class ContractService extends cds.ApplicationService {
    async init() {

        // ====================================================================
        // AUTHORIZATION HANDLERS
        // Admin-only: These entities contain Global Account-level aggregated
        // data that cannot be filtered by subaccount
        // ====================================================================

        this.before('READ', BillingDifferences, createAdminOnlyFilter('globalAccountId'))
        this.before('READ', Card_CreditBurnDowns, createAdminOnlyFilter('globalAccountId'))
        this.before('READ', Card_CreditBurnDownHeaders, createAdminOnlyFilter('globalAccountId'))
        this.before('READ', 'unique_globalAccountNames', createAdminOnlyFilter('ID'))

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



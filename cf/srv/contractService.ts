import cds from '@sap/cds'

import { Settings } from './settings'
import { addInFilter, hasUnrestrictedAccess } from './authorizationHelper'
import {
    BillingDifferences,
    Card_CreditBurnDownHeaders,
    Card_CreditBurnDowns
} from '#cds-models/ContractService'
import {
    reportYearMonthToText,
    reportYearMonthToTextShort
} from './functions'

const info = cds.log('contractService').info

export default class ContractService extends cds.ApplicationService {
    async init() {

        /**
         * Authorization: Block BillingDifferences for non-admin users
         * This entity shows Global Account-level aggregated billing data (costs + credits)
         * which cannot be filtered by subaccount - users with subaccount access only
         * should not see any billing differences data
         */
        this.before('READ', BillingDifferences, async req => {
            if (!hasUnrestrictedAccess(req)) {
                addInFilter(req.query, 'globalAccountId', ['__NO_ACCESS__'])
                info(`Authorization: Blocking BillingDifferences - user ${req.user?.id} does not have Admin access`)
            }
        })

        /**
         * Authorization: Block Card_CreditBurnDowns for non-admin users
         * Credit burndown is Global Account-level data
         */
        this.before('READ', Card_CreditBurnDowns, async req => {
            if (!hasUnrestrictedAccess(req)) {
                addInFilter(req.query, 'globalAccountId', ['__NO_ACCESS__'])
                info(`Authorization: Blocking Card_CreditBurnDowns - user ${req.user?.id} does not have Admin access`)
            }
        })

        /**
         * Authorization: Block Card_CreditBurnDownHeaders for non-admin users
         * Credit burndown is Global Account-level data
         */
        this.before('READ', Card_CreditBurnDownHeaders, async req => {
            if (!hasUnrestrictedAccess(req)) {
                addInFilter(req.query, 'globalAccountId', ['__NO_ACCESS__'])
                info(`Authorization: Blocking Card_CreditBurnDownHeaders - user ${req.user?.id} does not have Admin access`)
            }
        })

        /**
         * Authorization: Block unique_globalAccountNames for non-admin users
         * This is used for filtering in BillingDifferences which is admin-only
         */
        this.before('READ', 'unique_globalAccountNames', async req => {
            if (!hasUnrestrictedAccess(req)) {
                addInFilter(req.query, 'ID', ['__NO_ACCESS__'])
                info(`Authorization: Blocking unique_globalAccountNames - user ${req.user?.id} does not have Admin access`)
            }
        })

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



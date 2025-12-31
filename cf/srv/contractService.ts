import cds from '@sap/cds'

import { Settings } from './settings'
import { getUserAccessContext, addInFilter } from './authorizationHelper'
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

        /**
         * Authorization: Filter BillingDifferences by user access
         * Uses 'globalAccountId' field which corresponds to AccountStructureItem.ID
         */
        this.before('READ', BillingDifferences, async req => {
            const context = await getUserAccessContext(req)
            if (!context.isUnrestricted) {
                if (context.allowedIds.length === 0) {
                    addInFilter(req.query, 'globalAccountId', ['__NO_ACCESS__'])
                } else {
                    addInFilter(req.query, 'globalAccountId', context.allowedIds)
                }
                info(`Authorization: Filtering BillingDifferences to ${context.allowedIds.length} accessible IDs`)
            }
        })

        /**
         * Authorization: Filter Card_CreditBurnDowns by user access
         */
        this.before('READ', Card_CreditBurnDowns, async req => {
            const context = await getUserAccessContext(req)
            if (!context.isUnrestricted) {
                if (context.allowedIds.length === 0) {
                    addInFilter(req.query, 'globalAccountId', ['__NO_ACCESS__'])
                } else {
                    addInFilter(req.query, 'globalAccountId', context.allowedIds)
                }
                info(`Authorization: Filtering Card_CreditBurnDowns to ${context.allowedIds.length} accessible IDs`)
            }
        })

        /**
         * Authorization: Filter Card_CreditBurnDownHeaders by user access
         */
        this.before('READ', Card_CreditBurnDownHeaders, async req => {
            const context = await getUserAccessContext(req)
            if (!context.isUnrestricted) {
                if (context.allowedIds.length === 0) {
                    addInFilter(req.query, 'globalAccountId', ['__NO_ACCESS__'])
                } else {
                    addInFilter(req.query, 'globalAccountId', context.allowedIds)
                }
                info(`Authorization: Filtering Card_CreditBurnDownHeaders to ${context.allowedIds.length} accessible IDs`)
            }
        })

        /**
         * Authorization: Filter unique_globalAccountNames by user access
         */
        this.before('READ', 'unique_globalAccountNames', async req => {
            const context = await getUserAccessContext(req)
            if (!context.isUnrestricted) {
                if (context.allowedIds.length === 0) {
                    addInFilter(req.query, 'ID', ['__NO_ACCESS__'])
                } else {
                    addInFilter(req.query, 'ID', context.allowedIds)
                }
                info(`Authorization: Filtering unique_globalAccountNames to ${context.allowedIds.length} accessible IDs`)
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



using db from '../db/schema';
using AnalyticsService from './analyticsService';

@requires: ['Viewer']
service ContractsService {

    @readonly
    entity unique_globalAccountNames  as
        select distinct
            key ID,
                name,
                ROW_NUMBER() over(
                    order by name
                ) as position : Integer
        from db.AccountStructureItems[level = 'Global Account'];

    @readonly
    entity BillingDifferences         as
        projection on AnalyticsService.CloudCreditConsumptions {
            key globalAccountId,
                globalAccountName,
            key reportYearMonth,
                currency,
                Credits_balance_consumed,
                Credits_phaseStartDate,
                Measures_cost,
                Measures_paygCost,
                Measures_cloudCreditsCost,
                Credits_cloudCreditsForPhase,
                COALESCE(
                    Credits_balance_consumed, 0
                )-COALESCE(
                    Measures_cloudCreditsCost, 0
                )         as Billing_difference : Decimal(20, 2),
                'initial' as status             : String, // will be set in the code
                5         as criticality        : Integer // will be set in the code
        }
        where
                Credits_phaseStartDate is not null
            and Credits_status         =      'Actual'
        order by
            globalAccountName,
            reportYearMonth;

    /**
     * Returns the last 3 years of credit burndown
     */
    @readonly
    entity Card_CreditBurnDowns       as
        projection on AnalyticsService.CloudCreditConsumptions {
            key globalAccountId,
                globalAccountName,
            key reportYearMonth,
                reportYearMonth                                                           as month,
                Credits_status,
                currency,
                Credits_balance,
                Credits_cloudCreditsForPhase,
                Credits_phaseStartDate,
                Measures_cloudCreditsCost,
                Credits_balance_consumed,
                Predicted_credits_balance,
                (Credits_status = 'Actual' ? Credits_balance : Predicted_credits_balance) as chartBalance : Decimal(20, 2)
        }
        where
                Credits_phaseStartDate is not null
            and reportYearMonth        >=     (
                select max(reportYearMonth)-300 from AnalyticsService.CloudCreditConsumptions
                )
            order by
                globalAccountName,
                reportYearMonth;

    @readonly
    entity Card_CreditBurnDownHeaders as
        select * from Card_CreditBurnDowns
        where
            (
                reportYearMonth in (
                    select max(reportYearMonth) from Card_CreditBurnDowns
                    where
                        Credits_status = 'Actual'
                )
            );

}

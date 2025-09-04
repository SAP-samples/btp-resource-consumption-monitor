using db from '../db/schema';
using types from '../db/types';

@requires: [
    'Viewer',
    'system-user'
]
service RetrievalService {
    entity BTPServices                              as projection on db.BTPServices;
    entity CommercialMetrics                        as projection on db.CommercialMetrics;

    @cds.redirection.target
    entity CommercialMeasures                       as projection on db.CommercialMeasures;

    entity TechnicalMetrics                         as projection on db.TechnicalMetrics;
    entity TechnicalMeasures                        as projection on db.TechnicalMeasures;
    entity ForecastSettings                         as projection on db.ForecastSettings;
    entity AllocationSettings                       as projection on db.AllocationSettings;

    @readonly
    entity prepareCommercialMeasureMetricForecasts  as
        select
            reportYearMonth,
            retrieved,
            serviceId,
            interval,
            measureId,
            id,
            level,
            max_cost,
            measure_cost,
            measure_usage,
            measure_actualUsage,
            measure_chargedBlocks,

            case
                when method = 'Excluded'        then 1
                when method = 'TimeLinear'      then 1 / (DAYOFMONTH(retrieved) / DAYOFMONTH(LAST_DAY(retrieved)))
                when method = 'TimeDegressive'  then 1 / POWER((DAYOFMONTH(retrieved) / DAYOFMONTH(LAST_DAY(retrieved))), COALESCE(degressionFactor, 1))
            end as multiplier    : Decimal(20, 2),

            case
                when method = 'Excluded'        then 100
                when method = 'TimeLinear'      then (COALESCE(max_cost, 0) > 0 ? measure_cost * 1 / (DAYOFMONTH(retrieved) / DAYOFMONTH(LAST_DAY(retrieved))) * 100 / max_cost : 100)
                when method = 'TimeDegressive'  then (COALESCE(max_cost, 0) > 0 ? measure_cost * 1 / POWER( (DAYOFMONTH(retrieved) / DAYOFMONTH(LAST_DAY(retrieved))), COALESCE(degressionFactor, 1)) * 100 / max_cost : 100)
            end as forecastPct   : Integer

        from (
            select
                key c1.toMetric.toService.reportYearMonth,
                key c1.toMetric.toService.retrieved,
                key c1.toMetric.toService.serviceId,
                key c1.toMetric.toService.interval,
                key c1.toMetric.measureId,
                key c1.level,
                key c1.id,
                    c1.forecastSetting.method,
                    c1.forecastSetting.degressionFactor,
                    c1.measure.cost             as measure_cost,
                    c1.measure.usage            as measure_usage,
                    c1.measure.actualUsage      as measure_actualUsage,
                    c1.measure.chargedBlocks    as measure_chargedBlocks,
                    max(
                        c2.measure.cost
                    )                           as max_cost : Decimal(20, 2)
            from db.CommercialMeasures as c1
            left join db.CommercialMeasures as c2
                on  c1.toMetric.toService.serviceId = c2.toMetric.toService.serviceId
                and c1.toMetric.measureId           = c2.toMetric.measureId
                and c1.level                        = c2.level
                and c1.id                           = c2.id
                and c2.toMetric.toService.interval  = 'Monthly'
            where
                    c1.toMetric.toService.interval =  'Daily'
                and c1.toMetric.measureId          <> '_combined_'
            group by
                c2.toMetric.toService.serviceId,
                c2.toMetric.measureId,
                c2.level,
                c2.id,
                c1.toMetric.toService.reportYearMonth,
                c1.toMetric.toService.retrieved,
                c1.toMetric.toService.interval,
                c1.toMetric.toService.serviceId,
                c1.toMetric.measureId,
                c1.level,
                c1.id,
                c1.forecastSetting.method,
                c1.forecastSetting.degressionFactor,
                c1.measure.cost,
                c1.measure.usage,
                c1.measure.actualUsage,
                c1.measure.chargedBlocks
        ) as max_cost_table;

    @readonly
    entity prepareCommercialMeasureServiceForecasts as
        projection on db.CommercialMeasures {
            key toMetric {toService},
            key '_combined_'  as toMetric_measureId              : String,
            key level,
            key id,
                min(name)     as name                            : String,
                currency,
                ''            as unit                            : String,
                ''            as plans                           : String,
                sum(
                    measure.cost
                )             as measure_cost                    : Decimal(20, 2),
                sum(
                    measure.usage
                )             as measure_usage                   : Decimal(20, 2),
                sum(
                    measure.actualUsage
                )             as measure_actualUsage             : Decimal(20, 2),
                sum(
                    measure.chargedBlocks
                )             as measure_chargedBlocks           : Decimal(20, 2),
                sum(
                    measure.paygCost
                )             as measure_paygCost                : Decimal(20, 2),
                sum(
                    measure.cloudCreditsCost
                )             as measure_cloudCreditsCost        : Decimal(20, 2),
                sum(
                    forecast.cost
                )             as forecast_cost                   : Decimal(20, 2),
                sum(
                    forecast.usage
                )             as forecast_usage                  : Decimal(20, 2),
                sum(
                    forecast.actualUsage
                )             as forecast_actualUsage            : Decimal(20, 2),
                sum(
                    forecast.chargedBlocks
                )             as forecast_chargedBlocks          : Decimal(20, 2),
                // The below values will be updated in the Delta query later on
                null          as delta_measure_cost              : Decimal(20, 2),
                null          as delta_measure_usage             : Decimal(20, 2),
                null          as delta_measure_actualUsage       : Decimal(20, 2),
                null          as delta_measure_chargedBlocks     : Decimal(20, 2),
                null          as delta_measure_costPct           : Integer,
                null          as delta_measure_usagePct          : Integer,
                null          as delta_measure_actualUsagePct    : Integer,
                null          as delta_measure_chargedBlocksPct  : Integer,
                null          as delta_forecast_cost             : Decimal(20, 2),
                null          as delta_forecast_usage            : Decimal(20, 2),
                null          as delta_forecast_actualUsage      : Decimal(20, 2),
                null          as delta_forecast_chargedBlocks    : Decimal(20, 2),
                null          as delta_forecast_costPct          : Integer,
                null          as delta_forecast_usagePct         : Integer,
                null          as delta_forecast_actualUsagePct   : Integer,
                null          as delta_forecast_chargedBlocksPct : Integer,
                sum(max_cost) as max_cost                        : Decimal(20, 2),
                case
                    when
                        sum(max_cost)    is null
                        or sum(max_cost) =  0
                        or sum(
                            forecast.cost
                        )                is null
                    then
                        100
                    else
                        (
                            sum(
                                forecast.cost
                            ) * 100 / sum(max_cost)
                        )
                end           as forecastPct                     : Integer
        }
        where
            toMetric.measureId <> '_combined_'
        group by
            toMetric.toService,
            level,
            id,
            currency;

    entity prepareTechnicalAllocations              as
        select
            key a.serviceId,
            key tm.toMetric.toService.reportYearMonth,
            key tm.toMetric.toService.retrieved,
            key tm.toMetric.toService.interval,
            key a.cMeasureId,
            key tm.level,
            key tm.id   as targetID,
                tm.name as targetName,
                tm.measure.usage,
                tm.accountStructureItem.parentID
        from db.AllocationSettings as a
        inner join db.TechnicalMeasures as tm
            on  tm.toMetric.toService.serviceId =  a.serviceId
            and tm.toMetric.measureId           =  a.tMeasureId
            and tm.level                        in (
                'Space', 'Instance', 'Application'
            );

    entity AccountStructureItems                    as projection on db.AccountStructureItems;
    entity CloudCreditsDetails                      as projection on db.CloudCreditsDetailsResponseObjects;

    @readonly
    entity Alerts                                   as projection on db.Alerts;

    @readonly
    entity AlertLevelItems                          as
        projection on db.AlertLevelItems
        excluding {
            toItem
        };

    @readonly
    entity AlertServiceItems                        as
        projection on db.AlertServiceItems
        excluding {
            toItem
        };

    function downloadMeasuresForToday()                                 returns String;
    function downloadMeasuresForPastMonths(fromDate : Integer)          returns String;
    function resetForecastSettings()                                    returns String;
    function resetTechnicalAllocations()                                returns String;
    function calculateCommercialForecasts()                             returns String;
    function calculateCommercialForecastsForService(serviceId : String) returns String;
    function deleteAllData()                                            returns String;
    function deleteStructureAndTagData()                                returns String;
    function testAlert(ID : UUID, isDraft : Boolean)                    returns types.TAlertSimulation;
}

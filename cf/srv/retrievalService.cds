using db from '../db/schema';

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

    @readonly
    entity prepareCommercialMeasureMetricForecasts  as
        select
            key c1.toMetric.toService.reportYearMonth,
            key c1.toMetric.toService.retrieved,
            key c1.toMetric.toService.serviceName,
            key c1.toMetric.toService.interval,
            key c1.toMetric.metricName,
            key c1.level,
            key c1.name,
                c1.currency,
                c1.unit,
                c1.forecastSetting.method,
                c1.forecastSetting.degressionFactor,
                c1.measure.usage         as measure_usage,
                c1.measure.cost          as measure_cost,
                c1.measure.actualUsage   as measure_actualUsage,
                c1.measure.chargedBlocks as measure_chargedBlocks,
                max(
                    c2.measure.cost
                )                        as max_cost : Decimal(20, 2)
        from db.CommercialMeasures as c1
        left join db.CommercialMeasures as c2
            on  c1.toMetric.toService.serviceName = c2.toMetric.toService.serviceName
            and c1.toMetric.metricName            = c2.toMetric.metricName
            and c1.level                          = c2.level
            and c1.name                           = c2.name
            and c2.toMetric.toService.interval    = 'Monthly'
        where
                c1.toMetric.toService.interval =  'Daily'
            and c1.toMetric.metricName         <> '_combined_'
        group by
            c2.toMetric.toService.serviceName,
            c2.toMetric.metricName,
            c2.level,
            c2.name,
            c1.toMetric.toService.reportYearMonth,
            c1.toMetric.toService.retrieved,
            c1.toMetric.toService.interval,
            c1.toMetric.toService.serviceName,
            c1.toMetric.metricName,
            c1.level,
            c1.name,
            c1.currency,
            c1.unit,
            c1.forecastSetting.method,
            c1.forecastSetting.degressionFactor,
            c1.measure.usage,
            c1.measure.cost,
            c1.measure.actualUsage,
            c1.measure.chargedBlocks;

    @readonly
    entity prepareCommercialMeasureServiceForecasts as
        projection on db.CommercialMeasures {
            key toMetric {toService},
            key '_combined_'  as toMetric_metricName    : String,
            key level,
            key name,
                currency,
                ''            as unit                   : String,
                sum(
                    measure.cost
                )             as measure_cost           : Decimal(20, 2),
                sum(
                    measure.usage
                )             as measure_usage          : Decimal(20, 2),
                sum(
                    measure.actualUsage
                )             as measure_actualUsage    : Decimal(20, 2),
                sum(
                    measure.chargedBlocks
                )             as measure_chargedBlocks  : Decimal(20, 2),
                sum(
                    forecast.cost
                )             as forecast_cost          : Decimal(20, 2),
                sum(
                    forecast.usage
                )             as forecast_usage         : Decimal(20, 2),
                sum(
                    forecast.actualUsage
                )             as forecast_actualUsage   : Decimal(20, 2),
                sum(
                    forecast.chargedBlocks
                )             as forecast_chargedBlocks : Decimal(20, 2),
                sum(max_cost) as max_cost               : Decimal(20, 2),
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
                end           as forecastPct            : Integer
        }
        where
            toMetric.metricName <> '_combined_'
        group by
            toMetric.toService,
            level,
            name,
            currency;

    function downloadMeasuresForToday()                                   returns String;
    function downloadMeasuresForPastMonths(fromDate : Integer)            returns String;
    function resetForecastSettings()                                      returns String;
    function calculateCommercialForecasts()                               returns String;
    function calculateCommercialForecastsForService(serviceName : String) returns String;
    function deleteAllData()                                              returns String;
    function testAlert(ID : UUID)                                         returns String;
}

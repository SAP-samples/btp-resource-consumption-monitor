using db from '../db/schema';
using types from '../db/types';

@requires: ['Viewer']
service PresentationService {

    entity BTPAccountMeasures             as
        projection on db.CommercialMeasures {
            key toMetric.toService.reportYearMonth,
            key toMetric.toService.retrieved,
            key toMetric.toService.interval,
                level,
                name,
                currency,
                sum(
                    measure.cost
                ) as measure_cost           : Decimal(20, 2),
                sum(
                    measure.usage
                ) as measure_usage          : Decimal(20, 2),
                sum(
                    measure.actualUsage
                ) as measure_actualUsage    : Decimal(20, 2),
                sum(
                    measure.chargedBlocks
                ) as measure_chargedBlocks  : Decimal(20, 2),
                sum(
                    forecast.cost
                ) as forecast_cost          : Decimal(20, 2),
                sum(
                    forecast.usage
                ) as forecast_usage         : Decimal(20, 2),
                sum(
                    forecast.actualUsage
                ) as forecast_actualUsage   : Decimal(20, 2),
                sum(
                    forecast.chargedBlocks
                ) as forecast_chargedBlocks : Decimal(20, 2),
        }
        where
            //     level               = 'GlobalAccount'
            // and toMetric.metricName = '_combined_'
            toMetric.metricName = '_combined_'
        group by
            level,
            name,
            currency,
            toMetric.toService.reportYearMonth,
            toMetric.toService.retrieved,
            toMetric.toService.interval;

    @cds.redirection.target
    entity BTPServices                    as
        projection on db.BTPServices {
            *,
            count(
                distinct commercialMetrics.metricName
            )                                       as countCommercialMetrics : Integer @title: 'Commercials Metrics',
            STRING_AGG(
                commercialMetrics.metricName, '__' order by commercialMetrics.metricName
            )                                       as namesCommercialMetrics : String,
            count(
                distinct technicalMetrics.metricName
            )                                       as countTechnicalMetrics  : Integer @title: 'Technical Metrics',
            case
                when
                    (
                        count(
                            distinct commercialMetrics.metricName
                        ) = 0
                    )
                then
                    true
            end                                     as hideCommercialInfo     : Boolean,

            // Filters to display data on breakdown levels:
            cmByLevel[1 : level = 'GlobalAccount']  as cmByGlobalAccount,
            cmByLevel[level = 'Directory']          as cmByDirectory,
            cmByLevel[level = 'SubAccount']         as cmBySubAccount,
            cmByLevel[level = 'Datacenter']         as cmByDatacenter,
            // cmByMetricByLevel[1:level='GlobalAccount'] as cmByMetricByGlobalAccount,
            cmByMetricByLevel[level = 'Directory']  as cmByMetricByDirectory,
            cmByMetricByLevel[level = 'SubAccount'] as cmByMetricBySubAccount,
            cmByMetricByLevel[level = 'Datacenter'] as cmByMetricByDatacenter,
            tmByLevel[1 : level = 'GlobalAccount']  as tmByGlobalAccount,
            // tmByLevel[level='Directory'] as tmByDirectory,
            // tmByLevel[level='SubAccount'] as tmBySubAccount,
            // tmByLevel[level='Datacenter'] as tmByDatacenter,

            // tmByMetricByLevel[1:level='GlobalAccount'] as tmByMetricByGlobalAccount,
            tmByMetricByLevel[level = 'Directory']  as tmByMetricByDirectory,
            tmByMetricByLevel[level = 'SubAccount'] as tmByMetricBySubAccount,
            tmByMetricByLevel[level = 'Datacenter'] as tmByMetricByDatacenter,

        }
        group by
            reportYearMonth,
            serviceName,
            retrieved,
            lastSynced,
            interval
        actions {
            @Common.IsActionCritical
            action deleteBTPService();
        };


    @cds.redirection.target
    entity CommercialMetrics              as
        projection on db.CommercialMetrics {
            *,
            // Filters to display data on breakdown levels:
            commercialMeasures[1 : level = 'GlobalAccount'] as cmByGlobalAccount,
            commercialMeasures[level = 'Directory']         as cmByDirectory,
            commercialMeasures[level = 'SubAccount']        as cmBySubAccount,
            commercialMeasures[level = 'Datacenter']        as cmByDatacenter,
        } actions {
            @Common.SideEffects: {TargetEntities: [in]}
            action SetForecastSetting(
                                      @(
                                          Common:{
                                              ValueListWithFixedValues: true,
                                              ValueList               : {
                                                  CollectionPath: 'CL_ForecastMethods',
                                                  Parameters    : [{
                                                      $Type            : 'Common.ValueListParameterInOut',
                                                      ValueListProperty: 'code',
                                                      LocalDataProperty: 'method'
                                                  }]
                                              }
                                          },
                                          UI.ParameterDefaultValue:in.forecastSetting.method,
                                          title:'Forecasting Method'
                                      )
                                      method : String,

                                      /**
                                       * Zero or positive number indicating the rate of continued usage:
                                       * - 0: Same as 'excluded'
                                       * - < 1: the usage of the remaining days will be lower than the usage of the past days (degressive)
                                       * - = 1: the usage of the remaining days will be similar to the usage of the past days (linear)
                                       * - \> 1: the usage of the remaining days will be higher than the usage of the past days (progressive)
                                       */
                                      @(
                                          assert.range:[
                                              0,
                                              10
                                          ],
                                          title:'Degression factor (if method is TimeDegressive)',
                                          UI.ParameterDefaultValue:in.forecastSetting.degressionFactor
                                      )
                                      degressionFactor : Double);

            @Common.IsActionCritical
            //TODO: UI refresh after delete
            action deleteCommercialMetric();
        };


    @cds.redirection.target
    entity CommercialMeasures             as
        projection on db.CommercialMeasures {
            *,
            toMetric.toService.retrieved as retrieved, // Used in Chart
            toMetric.toService.interval  as interval, // Used in Chart
            toMetric.metricName          as metricName, // Used in Chart
        };

    entity TechnicalMetrics               as
        projection on db.TechnicalMetrics {
            *,
            // Filters to display data on breakdown levels:
            technicalMeasures[1 : level = 'GlobalAccount'] as tmByGlobalAccount,
            technicalMeasures[level = 'Directory']         as tmByDirectory,
            technicalMeasures[level = 'SubAccount']        as tmBySubAccount,
            technicalMeasures[level = 'Datacenter']        as tmByDatacenter,
        } actions {
            @Common.IsActionCritical
            action deleteTechnicalMetric();
        };

    @cds.redirection.target
    entity TechnicalMeasures              as
        projection on db.TechnicalMeasures {
            *,
            toMetric.toService.retrieved as retrieved, // Used in Chart
            toMetric.toService.interval  as interval, // Used in Chart
            toMetric.metricName          as metricName, // Used in Chart
        };

    @readonly
    entity CodeLists                      as projection on db.CodeLists;

    entity CL_ForecastMethods             as projection on CodeLists[list = 'ForecastMethods'];
    entity ForecastSettings               as projection on db.ForecastSettings;
    // Services used in Selection Field value helps
    entity unique_serviceName             as select distinct key serviceName from db.BTPServices;
    entity unique_reportYearMonth         as select distinct key reportYearMonth from db.BTPServices;
    entity unique_interval                as select distinct key interval from db.BTPServices;
    entity unique_metricName              as select distinct key metricName from db.CommercialMetrics; //not used


    function getLatestBTPAccountMeasure() returns BTPAccountMeasures;
    function getTileInfo()                returns types.TDynamicAppLauncher;
    action   proxy_downloadMeasuresForToday();

    action   proxy_downloadMeasuresForPastMonths( @(
                                                      assert.range:[
                                                          201001,
                                                          209912
                                                      ],
                                                      UI.ParameterDefaultValue:'202311',
                                                      title:'Load from which month'
                                                  ) fromDate : String);

    action   proxy_calculateCommercialForecasts();

    @Common.IsActionCritical
    action   proxy_resetForecastSettings();

    @Common.IsActionCritical
    action   proxy_deleteAllData();


    /**
     * For Work Zone cards
     */
    @readonly
    entity Card_HighestForecastServices   as
        projection on BTPServices {
            *
        }
        where
                retrieved = CURRENT_DATE
            and interval  = 'Daily';

    entity Card_TodaysMeasuresByLevel    as projection on BTPAccountMeasures[retrieved = CURRENT_DATE and name <> ''];
}

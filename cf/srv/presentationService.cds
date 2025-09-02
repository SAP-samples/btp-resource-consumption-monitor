using db from '../db/schema';
using types from '../db/types';
using AnalyticsService from './analyticsService';

@requires: ['Viewer']
service PresentationService {

    @readonly
    entity AccountStructureItems        as projection on db.AccountStructureItems;

            @cds.redirection.target
    entity BTPServices                  as
        projection on db.BTPServices {
            *,
            count(distinct commercialMetrics.measureId)                      as countCommercialMetrics : Integer @title: 'Commercials Metrics',
            STRING_AGG(
                commercialMetrics.metricName, '__' order by commercialMetrics.metricName
            )                                                                as namesCommercialMetrics : String,
            count(distinct technicalMetrics.measureId)                       as countTechnicalMetrics  : Integer @title: 'Technical Metrics',
            (count(distinct commercialMetrics.measureId) = 0 ? true : false) as hideCommercialInfo     : Boolean,

            // Filters to display data on breakdown levels:
            cmByLevel[1 : level = 'Customer']                                as cmByCustomer,
            cmByLevel[level = 'Global Account']                              as cmByGlobalAccount,
            cmByLevel[level = 'Directory']                                   as cmByDirectory,
            cmByLevel[level = 'Sub Account']                                 as cmBySubAccount,
            cmByLevel[level = 'Datacenter']                                  as cmByDatacenter,
            // cmByLevel[level = 'Space']                  as cmBySpace,
            //
            // cmByMetricByLevel[1 : level = 'Customer']  as cmByMetricByCustomer,
            cmByMetricByLevel[level = 'Global Account']                      as cmByMetricByGlobalAccount,
            cmByMetricByLevel[level = 'Directory']                           as cmByMetricByDirectory,
            cmByMetricByLevel[level = 'Sub Account']                         as cmByMetricBySubAccount,
            cmByMetricByLevel[level = 'Datacenter']                          as cmByMetricByDatacenter,
            cmByMetricByLevel[level = 'Space']                               as cmByMetricBySpace,
            cmByMetricByLevel[level = 'Instance']                            as cmByMetricByInstance,
            cmByMetricByLevel[level = 'Application']                         as cmByMetricByApplication,
            //
            tmByLevel[1 : level = 'Customer']                                as tmByCustomer,
            tmByLevel[level = 'Global Account']                              as tmByGlobalAccount,
            // tmByLevel[level = 'Directory']          as tmByDirectory,
            // tmByLevel[level = 'Sub Account']         as tmBySubAccount,
            // tmByLevel[level = 'Datacenter']         as tmByDatacenter,
            //
            // tmByMetricByLevel[1 : level = 'Customer']  as tmByMetricByCustomer,
            tmByMetricByLevel[level = 'Global Account']                      as tmByMetricByGlobalAccount,
            tmByMetricByLevel[level = 'Directory']                           as tmByMetricByDirectory,
            tmByMetricByLevel[level = 'Sub Account']                         as tmByMetricBySubAccount,
            tmByMetricByLevel[level = 'Datacenter']                          as tmByMetricByDatacenter,
            tmByMetricByLevel[level = 'Space']                               as tmByMetricBySpace,
            tmByMetricByLevel[level = 'Instance']                            as tmByMetricByInstance,
            tmByMetricByLevel[level = 'Application']                         as tmByMetricByApplication,
        }
        group by
            reportYearMonth,
            serviceId,
            serviceName,
            retrieved,
            lastSynced,
            interval
        actions {
            @Common.IsActionCritical
            action deleteBTPService();
        };


            @cds.redirection.target
    entity CommercialMetrics            as
        projection on db.CommercialMetrics {
            *,
            // Filters to display data on breakdown levels:
            commercialMeasures[1 : level = 'Customer']   as cmByCustomer,
            commercialMeasures[level = 'Global Account'] as cmByGlobalAccount,
            commercialMeasures[level = 'Directory']      as cmByDirectory,
            commercialMeasures[level = 'Sub Account']    as cmBySubAccount,
            commercialMeasures[level = 'Datacenter']     as cmByDatacenter,
            commercialMeasures[level = 'Space']          as cmBySpace,
            commercialMeasures[level = 'Instance']       as cmByInstance,
            commercialMeasures[level = 'Application']    as cmByApplication
        }
        actions {
            @Common.SideEffects: {TargetEntities: [in]}
            action SetForecastSetting(
                                      @(UI.ParameterDefaultValue: in.forecastSetting.method)
                                      method: types.TSetForecastSettingParams:method,
                                      @(
                                          UI.ParameterDefaultValue: in.forecastSetting.degressionFactor,
                                          UI.Hidden : ( :method = 'TimeDegressive' ? false : true)
                                      )
                                      degressionFactor: types.TSetForecastSettingParams:degressionFactor);

            @Common.IsActionCritical
            //TODO: UI refresh after delete
            action deleteCommercialMetric();

            @Common.SideEffects: {TargetEntities: [in.technicalMetricForAllocation]}
            action SetTechnicalMetricForAllocation(
                                                   @(
                                                       Common: {
                                                           ValueListWithFixedValues: true,
                                                           ValueList               : {
                                                               PresentationVariantQualifier: '#sorted',
                                                               CollectionPath              : 'unique_TMetricsByServices',
                                                               Parameters                  : [
                                                                   {
                                                                       $Type            : 'Common.ValueListParameterIn',
                                                                       ValueListProperty: 'serviceId',
                                                                       LocalDataProperty: in.toService.serviceId
                                                                   },
                                                                   {
                                                                       $Type            : 'Common.ValueListParameterInOut',
                                                                       ValueListProperty: 'measureId',
                                                                       LocalDataProperty: tMeasureId
                                                                   },
                                                                   {
                                                                       $Type            : 'Common.ValueListParameterOut',
                                                                       ValueListProperty: 'metricName',
                                                                       LocalDataProperty: metricName
                                                                   }
                                                               ]
                                                           }
                                                       },
                                                       UI.ParameterDefaultValue: in.technicalMetricForAllocation.tMeasureId
                                                   )
                                                   tMeasureId: types.TSetTechnicalMetricForAllocationParams:tMeasureId,
                                                   @(
                                                       UI.ParameterDefaultValue: in.technicalMetricForAllocation.metricName,
                                                       UI.Hidden: true
                                                   ) metricName: types.TSetTechnicalMetricForAllocationParams:metricName);
        };


    @cds.redirection.target
    entity CommercialMeasures           as
        projection on db.CommercialMeasures {
            *,
            toMetric.toService.retrieved as retrieved, // Used in Chart
            toMetric.toService.interval  as interval, // Used in Chart
            toMetric.metricName          as metricName, // Used in Chart
        };

            @cds.redirection.target
    entity TechnicalMetrics             as
        projection on db.TechnicalMetrics {
            *,
            // Filters to display data on breakdown levels:
            technicalMeasures[1 : level = 'Customer']   as tmByCustomer,
            technicalMeasures[level = 'Global Account'] as tmByGlobalAccount,
            technicalMeasures[level = 'Directory']      as tmByDirectory,
            technicalMeasures[level = 'Sub Account']    as tmBySubAccount,
            technicalMeasures[level = 'Datacenter']     as tmByDatacenter,
            technicalMeasures[level = 'Space']          as tmBySpace,
            technicalMeasures[level = 'Instance']       as tmByInstance,
            technicalMeasures[level = 'Application']    as tmByApplication
        }
        actions {
            @Common.IsActionCritical
            action deleteTechnicalMetric();
        };

    @cds.redirection.target
    entity TechnicalMeasures            as
        projection on db.TechnicalMeasures {
            *,
            toMetric.toService.retrieved as retrieved, // Used in Chart
            toMetric.toService.interval  as interval, // Used in Chart
            toMetric.metricName          as metricName, // Used in Chart
        };

    @readonly
    entity CodeLists                    as projection on db.CodeLists;

    entity CL_ForecastMethods           as projection on CodeLists[list = 'ForecastMethods'];
    entity ForecastSettings             as projection on db.ForecastSettings;
    entity AllocationSettings           as projection on db.AllocationSettings;
    // Services used in Selection Field value helps
    entity unique_serviceNames          as select distinct key serviceName from db.BTPServices;
    entity unique_reportYearMonths      as select distinct key reportYearMonth from db.BTPServices;
    entity unique_intervals             as select distinct key interval from db.BTPServices;
    entity unique_metricNames           as select distinct key metricName from db.CommercialMetrics; //not used

    @readonly
    entity unique_TMetricsByServices    as
        select distinct
            key toService.serviceId,
            key measureId @(
                Common.Text           : metricName,
                Common.TextArrangement: #TextOnly
            ),
                metricName
        from db.TechnicalMetrics
        where
            measureId <> '_combined_'
        order by
            serviceId,
            metricName;

    @readonly
    entity AggregatedCommercialMeasures as projection on AnalyticsService.AggregatedCommercialMeasures;

    function getLatestBTPAccountMeasure() returns AggregatedCommercialMeasures;
    function getTileInfo()                returns types.TDynamicAppLauncher;

    @Common.SideEffects.TargetEntities: ['/PresentationService.EntityContainer/BTPServices']
    action   proxy_downloadMeasuresForToday();

    @Common.SideEffects.TargetEntities: ['/PresentationService.EntityContainer/BTPServices']
    action   proxy_downloadMeasuresForPastMonths( @(
                                                      assert.range: [
                                                          201001,
                                                          209912
                                                      ],
                                                      UI.ParameterDefaultValue: '202311',
                                                      title: 'Load from which month'
                                                  ) fromDate: String);

    action   proxy_calculateCommercialForecasts();

    @Common.IsActionCritical
    action   proxy_resetForecastSettings();

    @Common.IsActionCritical
    action   proxy_resetTechnicalAllocations();

    @Common.IsActionCritical
    action   proxy_deleteAllData();

    @Common.IsActionCritical
    action   proxy_deleteStructureAndTagData();

    /**
     * For Work Zone cards
     */
    @readonly
    entity Card_HighestForecastServices as
        projection on BTPServices {
            *
        }
        where
                // retrieved = CURRENT_DATE
                retrieved in (
                select max(retrieved) from BTPServices
                where
                        countCommercialMetrics > 0
                    and interval               = 'Daily'
            )
            and interval  =  'Daily';

    @readonly
    entity Card_HistoricTrends          as
        projection on AnalyticsService.AggregatedCommercialMeasures {
            *
        }
        where
                level    = 'Customer'
            and interval = 'Daily'
        order by
            retrieved desc
        limit 66;

    @readonly
    entity Card_TodaysMeasuresByLevels  as
        projection on AnalyticsService.AggregatedCommercialMeasures {
            *
        }
        where
            //retrieved = CURRENT_DATE
            retrieved in (
                select max(retrieved) from AnalyticsService.AggregatedCommercialMeasures
            );
// and name      <> '';
}

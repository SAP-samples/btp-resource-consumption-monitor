using db from '../db/schema';

@requires: ['Viewer']
service ManageAlertsService {

    @odata.draft.enabled
    @Common.DraftRoot: {
        $Type           : 'Common.DraftRootType',
        ActivationAction: 'ManageAlertsService.draftActivate',
        NewAction       : 'ManageAlertsService.getDefaultValues'
    }
    entity Alerts                 as
        projection on db.Alerts {
            *,
            (active = true ? 3 : 1) as activeCriticality : Integer
        }
        actions {
            @cds.odata.bindingparameter.collection
            action getDefaultValues() returns Alerts;
        };

    entity AlertThresholds        as
        projection on db.AlertThresholds {
            *,
            property || ' (' || operator || amount || ')' as text : String
        };

    @readonly
    entity LevelNames             as
        projection on db.AccountStructureItems {
            ID as id,
            level,
            name
        }
        order by
            name;

    @readonly
    entity ServiceAndMetricNames  as
            select distinct
                key id,
                    level,
                    name
            from (
                (
                    select
                        'Service'               as level : String,
                        'service_' || serviceId as id    : String,
                        serviceName             as name  : String
                    from db.BTPServices
                ) union (
                    select
                        'Commercial Metric'     as level : String,
                        'cmetric_' || measureId as id    : String,
                        metricName              as name  : String
                    from db.CommercialMetrics
                    where
                        measureId <> '_combined_'
                ) union (
                    select
                        'Technical Metric'      as level : String,
                        'tmetric_' || measureId as id    : String,
                        metricName              as name  : String
                    from db.TechnicalMetrics
                    where
                        measureId <> '_combined_'
                )
            )
            order by
                name;

    @readonly
    entity CodeLists              as projection on db.CodeLists;

    entity CL_AggregationLevels   as projection on CodeLists[list = 'AggregationLevels'];
    entity CL_ServiceScopes       as projection on CodeLists[list = 'ServiceScopes'];
    entity CL_AlertTypes          as projection on CodeLists[list = 'AlertTypes'];
    entity CL_ThresholdProperties as projection on CodeLists[list = 'ThresholdProperties'];
    entity CL_ThresholdOperators  as projection on CodeLists[list = 'ThresholdOperators'];

    entity CL_AlertIncludeModes   as projection on CodeLists[list = 'AlertIncludeModes']
                                     order by
                                         description desc;
}

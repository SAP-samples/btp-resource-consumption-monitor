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
            case
                when
                    active = true
                then
                    3
                else
                    1
            end as activeCriticality : Integer
        } actions {
            @Core.OperationAvailable: {$edmJson: {$Not: {$Path: 'in/IsActiveEntity'}}}
            @Common.SideEffects     : {TargetEntities: [in]}
            action setLevelItems(
                                 @(Common:{
                                     ValueListWithFixedValues: false,
                                     ValueList               : {
                                         CollectionPath: 'LevelNames',
                                         Parameters    : [
                                             {
                                                 $Type            : 'Common.ValueListParameterIn',
                                                 LocalDataProperty: in.levelScope,
                                                 ValueListProperty: 'level'
                                             },
                                             {
                                                 $Type            : 'Common.ValueListParameterOut',
                                                 ValueListProperty: 'name',
                                                 LocalDataProperty: 'items'
                                             },
                                         ]
                                     }
                                 })
                                 @title:'Items to include/exclude'
                                 items : many String);
            @Core.OperationAvailable: {$edmJson: {$Not: {$Path: 'in/IsActiveEntity'}}}
            @Common.SideEffects     : {TargetEntities: [in]}
            action setServiceItems(
                                   @(Common:{
                                       ValueListWithFixedValues: false,
                                       ValueList               : {
                                           CollectionPath: 'ServiceAndMetricNames',
                                           Parameters    : [
                                               {
                                                   $Type            : 'Common.ValueListParameterIn',
                                                   LocalDataProperty: in.serviceScope,
                                                   ValueListProperty: 'level'
                                               },
                                               {
                                                   $Type            : 'Common.ValueListParameterOut',
                                                   ValueListProperty: 'name',
                                                   LocalDataProperty: 'items'
                                               },
                                           ]
                                       }
                                   })
                                   @title:'Items to include/exclude'
                                   items : many String);
            @cds.odata.bindingparameter.collection
            action getDefaultValues() returns Alerts;

            @Core.OperationAvailable: in.IsActiveEntity
            action testAlert()        returns String;
        };

    entity AlertThresholds        as
        projection on db.AlertThresholds {
            *,
            property || ' (' || operator || amount || ')' as text : String
        };

    @readonly
    entity LevelNames             as
            select
                key level,
                key name
            from (
                (
                    select
                    level,
                    name
                    from db.CommercialMeasures
                ) union(
                    select
                        level,
                        name
                    from db.TechnicalMeasures
                )
            )
            group by
                level,
                name;

    @readonly
    entity ServiceAndMetricNames  as
            select
                key level,
                key name
            from (
                (
                    select
                    'Service'   as level    : String,
                    serviceName as name     : String
                    from db.BTPServices
                ) union(
                    select
                        'Metric'   as level : String,
                        metricName as name  : String
                    from db.CommercialMetrics
                )
            )
            group by
                level,
                name;

    @readonly
    entity CodeLists              as projection on db.CodeLists;

    entity CL_AggregationLevels   as projection on CodeLists[list = 'AggregationLevels'];
    entity CL_ServiceScopes       as projection on CodeLists[list = 'ServiceScopes'];
    entity CL_AlertTypes          as projection on CodeLists[list = 'AlertTypes'];
    entity CL_ThresholdProperties as projection on CodeLists[list = 'ThresholdProperties'];
    entity CL_ThresholdOperators  as projection on CodeLists[list = 'ThresholdOperators'];
    entity CL_AlertIncludeModes   as projection on CodeLists[list = 'AlertIncludeModes'];
}

namespace db;

using types from './types';
using ManageAlertsService from '../srv/manageAlertsService';

/**
 * Services, Metrics and Measures
 */

entity BTPServices {
    key reportYearMonth                         : String          @title        : 'Month';
    key serviceId                               : String          @title        : 'ID';
        serviceName                             : String          @title        : 'Service';
    key retrieved                               : Date            @title        : 'Date';
    key interval                                : types.TInterval @title        : 'Reading';
        lastSynced                              : DateTime        @cds.on.insert: $now  @cds.on.update: $now;
        virtual namesCommercialMetrics          : String          @Core.Computed;
        virtual hideCommercialInfo              : Boolean;
        virtual hideGlobalAccountDistribution   : Boolean;
        virtual hideCommercialSpaceAllocation   : Boolean;
        virtual hideServiceInstanceDistribution : Boolean;

        // Used to display History on the Object Page
        history                                 : Association to many BTPServices
                                                      on history.serviceId = serviceId;

        // Composition only used to leverage delete cascade
        commercialMetricsComposition            : Composition of many CommercialMetrics
                                                      on commercialMetricsComposition.toService = $self;
        technicalMetricsComposition             : Composition of many TechnicalMetrics
                                                      on technicalMetricsComposition.toService = $self;

        // Used to display list of Metrics in Object Page.
        commercialMetrics                       : Association to many CommercialMetrics
                                                      on  commercialMetrics.toService =  $self
                                                      and commercialMetrics.measureId <> '_combined_';
        commercialMetricsHistory                : Association to many CommercialMetrics
                                                      on  commercialMetricsHistory.toService.serviceId =  serviceId
                                                      and commercialMetricsHistory.measureId           <> '_combined_';

        // Used to display list of Metrics in Object Page.
        technicalMetrics                        : Association to many TechnicalMetrics
                                                      on  technicalMetrics.toService =  $self
                                                      and technicalMetrics.measureId <> '_combined_';
        technicalMetricsHistory                 : Association to many TechnicalMetrics
                                                      on  technicalMetricsHistory.toService.serviceId =  serviceId
                                                      and technicalMetricsHistory.measureId           <> '_combined_';

        // Used in timeline chart in Object Page:
        cmHistoryByMetricAll                    : Association to many CommercialMeasures
                                                      on  cmHistoryByMetricAll.toMetric.toService.serviceId =  serviceId
                                                      and cmHistoryByMetricAll.level                        =  'Global Account'
                                                      and cmHistoryByMetricAll.toMetric.measureId           <> '_combined_';
        cmHistoryByMetricDaily                  : Association to many CommercialMeasures
                                                      on  cmHistoryByMetricDaily.toMetric.toService.serviceId =  serviceId
                                                      and cmHistoryByMetricDaily.toMetric.toService.interval  =  'Daily'
                                                      and cmHistoryByMetricDaily.level                        =  'Global Account'
                                                      and cmHistoryByMetricDaily.toMetric.measureId           <> '_combined_';
        cmHistoryByMetricMonthly                : Association to many CommercialMeasures
                                                      on  cmHistoryByMetricMonthly.toMetric.toService.serviceId =  serviceId
                                                      and cmHistoryByMetricMonthly.toMetric.toService.interval  =  'Monthly'
                                                      and cmHistoryByMetricMonthly.level                        =  'Global Account'
                                                      and cmHistoryByMetricMonthly.toMetric.measureId           <> '_combined_';

        // Used to display the breakdowns per level on the Object Page:
        cmByMetricByLevel                       : Association to many CommercialMeasures
                                                      on  cmByMetricByLevel.toMetric.toService.reportYearMonth =  reportYearMonth
                                                      and cmByMetricByLevel.toMetric.toService.retrieved       =  retrieved
                                                      and cmByMetricByLevel.toMetric.toService.interval        =  interval
                                                      and cmByMetricByLevel.toMetric.toService.serviceId       =  serviceId
                                                      and cmByMetricByLevel.toMetric.measureId                 <> '_combined_';
        tmByMetricByLevel                       : Association to many TechnicalMeasures
                                                      on  tmByMetricByLevel.toMetric.toService.reportYearMonth =  reportYearMonth
                                                      and tmByMetricByLevel.toMetric.toService.retrieved       =  retrieved
                                                      and tmByMetricByLevel.toMetric.toService.interval        =  interval
                                                      and tmByMetricByLevel.toMetric.toService.serviceId       =  serviceId
                                                      and tmByMetricByLevel.toMetric.measureId                 <> '_combined_';

        // Used to display measures on the List View, and account name and measures and graphs on the Object Page:
        cmByLevel                               : Association to many CommercialMeasures
                                                      on  cmByLevel.toMetric.toService.reportYearMonth = reportYearMonth
                                                      and cmByLevel.toMetric.toService.retrieved       = retrieved
                                                      and cmByLevel.toMetric.toService.interval        = interval
                                                      and cmByLevel.toMetric.toService.serviceId       = serviceId
                                                      and cmByLevel.toMetric.measureId                 = '_combined_';
        tmByLevel                               : Association to many TechnicalMeasures
                                                      on  tmByLevel.toMetric.toService.reportYearMonth = reportYearMonth
                                                      and tmByLevel.toMetric.toService.retrieved       = retrieved
                                                      and tmByLevel.toMetric.toService.interval        = interval
                                                      and tmByLevel.toMetric.toService.serviceId       = serviceId
                                                      and tmByLevel.toMetric.measureId                 = '_combined_';
}

entity CommercialMetrics {
    key toService                               :      Association to BTPServices;
    key measureId                               :      String     @title: 'ID'; // equals to '_combined_' in case multiple metrics are summed up
        metricName                              :      String     @title: 'Metric';
        tags                                    : many types.TTag @title: 'Platform Tags';
        virtual tagStrings                      :      String     @title: 'Platform Tags';
        virtual hideGlobalAccountDistribution   :      Boolean;
        virtual hideCommercialSpaceAllocation   :      Boolean;
        virtual hideServiceInstanceDistribution :      Boolean;

        forecastSetting                         :      Association to one ForecastSettings
                                                           on  forecastSetting.serviceId = toService.serviceId
                                                           and forecastSetting.measureId = measureId;

        // Used to map commercial metrics to a technical metric for downstream allocation to Space level
        technicalMetricForAllocation            :      Association to one AllocationSettings
                                                           on  technicalMetricForAllocation.serviceId  = toService.serviceId
                                                           and technicalMetricForAllocation.cMeasureId = measureId;

        // Used to display measures on the Service Object Page and Metric Object Page
        commercialMeasures                      :      Composition of many CommercialMeasures
                                                           on commercialMeasures.toMetric = $self;

        // Used to display History on the Object Page
        history                                 :      Association to many CommercialMetrics
                                                           on  history.toService.serviceId = toService.serviceId
                                                           and history.measureId           = measureId;
}

entity TechnicalMetrics {
    key toService                               :      Association to BTPServices;
    key measureId                               :      String     @title: 'ID'; // equals to '_combined_' in case multiple metrics are summed up
        metricName                              :      String     @title: 'Metric';
        tags                                    : many types.TTag @title: 'Platform Tags';
        virtual tagStrings                      :      String     @title: 'Platform Tags';
        virtual hideGlobalAccountDistribution   :      Boolean;
        virtual hideServiceInstanceDistribution :      Boolean;

        // Used to display measures on the Service Object Page and Metric Object Page
        technicalMeasures                       :      Composition of many TechnicalMeasures
                                                           on technicalMeasures.toMetric = $self;

        // Used to display History on the Object Page
        history                                 :      Association to many TechnicalMetrics
                                                           on  history.toService.serviceId = toService.serviceId
                                                           and history.measureId           = measureId;
}

entity CommercialMeasures {
    key toMetric                         : Association to CommercialMetrics;
    key level                            : types.TAggregationLevel      @title: 'Level';
    key id                               : String;
        name                             : String                       @title: 'Name';
        currency                         : String                       @title: 'Currency';
        unit                             : String                       @title: 'Unit';
        plans                            : String                       @title: 'Plans';
        measure                          : {
            cost                 : Decimal(20, 2)                       @title: 'Cost'                               @Measures.ISOCurrency: currency;
            usage                : Decimal(20, 2)                       @title: 'Usage';
            actualUsage          : Decimal(20, 2)                       @title: 'Actual Usage';
            chargedBlocks        : Decimal(20, 2)                       @title: 'Charged Blocks';
            paygCost             : Decimal(20, 2)                       @title: 'Overcharged'                        @Measures.ISOCurrency: currency;
            cloudCreditsCost     : Decimal(20, 2)                       @title: 'Consumed Credits'                   @Measures.ISOCurrency: currency;
        };
        forecast                         : {
            cost                 : Decimal(20, 2)                       @title: 'Forecasted Cost'                    @Measures.ISOCurrency: currency;
            usage                : Decimal(20, 2)                       @title: 'Forecasted Usage';
            actualUsage          : Decimal(20, 2)                       @title: 'Forecasted Actual Usage';
            chargedBlocks        : Decimal(20, 2)                       @title: 'Forecasted Charged Blocks';
        };
        delta                            : {
            measure              : {
                cost             : Decimal(20, 2)                       @title: 'Delta Cost'                         @Measures.ISOCurrency: currency;
                usage            : Decimal(20, 2)                       @title: 'Delta Usage';
                actualUsage      : Decimal(20, 2)                       @title: 'Delta Actual Usage';
                chargedBlocks    : Decimal(20, 2)                       @title: 'Delta Charged Blocks';
                costPct          : Integer                              @title: 'Delta Cost %'                       @Measures.Unit       : '%';
                usagePct         : Integer                              @title: 'Delta Usage %'                      @Measures.Unit       : '%';
                actualUsagePct   : Integer                              @title: 'Delta Actual Usage %'               @Measures.Unit       : '%';
                chargedBlocksPct : Integer                              @title: 'Delta Charged Blocks %'             @Measures.Unit       : '%';
            };
            forecast             : {
                cost             : Decimal(20, 2)                       @title: 'Delta Forecasted Cost'              @Measures.ISOCurrency: currency;
                usage            : Decimal(20, 2)                       @title: 'Delta Forecasted Usage';
                actualUsage      : Decimal(20, 2)                       @title: 'Delta Forecasted Actual Usage';
                chargedBlocks    : Decimal(20, 2)                       @title: 'Delta Forecasted Charged Blocks';
                costPct          : Integer                              @title: 'Delta Forecasted Cost %'            @Measures.Unit       : '%';
                usagePct         : Integer                              @title: 'Delta Forecasted Usage %'           @Measures.Unit       : '%';
                actualUsagePct   : Integer                              @title: 'Delta Forecasted Actual Usage %'    @Measures.Unit       : '%';
                chargedBlocksPct : Integer                              @title: 'Delta Forecasted Charged Blocks %'  @Measures.Unit       : '%';
            };
        };
        max_cost                         : Decimal(20, 2) default null  @title: 'Previous Max Cost'                  @Measures.ISOCurrency: currency;
        forecastPct                      : Integer                      @title: 'Forecasted'                         @Measures.Unit       : '%';
        virtual forecastPctCriticality   : Integer;
        virtual deltaActualsCriticality  : Integer;
        virtual deltaForecastCriticality : Integer;
        virtual costChart                : types.TBulletChart;
        accountStructureItem             : Association to one AccountStructureItems
                                               on accountStructureItem.ID = id;

        // Used as quick link for the forecast calculation
        forecastSetting                  : Association to one ForecastSettings
                                               on  forecastSetting.serviceId = toMetric.toService.serviceId
                                               and forecastSetting.measureId = toMetric.measureId;
}

entity TechnicalMeasures {
    key toMetric                        : Association to TechnicalMetrics;
    key level                           : types.TAggregationLevel @title: 'Level';
    key id                              : String;
        name                            : String                  @title: 'Name';
        unit                            : String                  @title: 'Unit';
        plans                           : String                  @title: 'Plans';
        measure                         : {
            usage        : Decimal(20, 2)                         @title: 'Usage';
        };
        delta                           : {
            measure      : {
                usage    : Decimal(20, 2)                         @title: 'Delta Usage';
                usagePct : Integer                                @title: 'Delta Usage %'  @Measures.Unit: '%';
            };
        };
        virtual deltaActualsCriticality : Integer;
        accountStructureItem            : Association to one AccountStructureItems
                                              on accountStructureItem.ID = id;
}

entity ForecastSettings {
    key serviceId        : String                @title: 'Service';
    key measureId        : String                @title: 'Metric';
        method           : types.TForecastMethod @title: 'Method';
        /**
         * Zero or positive number indicating the rate of continued usage:
         * - 0: Same as 'excluded'
         * - < 1: the usage of the remaining days will be lower than the usage of the past days (degressive)
         * - = 1: the usage of the remaining days will be similar to the usage of the past days (linear)
         * - \> 1: the usage of the remaining days will be higher than the usage of the past days (progressive)
         */
        degressionFactor : Double                @title: 'Degression Factor';

        @title: 'Forecast Relevance'
        statusText       : String = (method = 'Excluded' ? 'Not Forecasted' : (method = 'TimeDegressive' ? method || ' [' || degressionFactor || ']' : method))
}

// Contract entity to maintain mapping between commercial metric and technical metric for downstream cost allocation
entity AllocationSettings {
    key serviceId  : String;
    key cMeasureId : String;
        mode       : String; // placeholder for future extensions
        tServiceId : String; // placeholder for future extensions
        tMeasureId : String;
        metricName : String;
}


/**
 * Alerts
 */

entity Alerts {
    key ID                        : UUID                              @UI.Hidden             @Core.Computed;
        active                    : Boolean default true              @title        : 'Enabled';
        virtual activeCriticality : Integer;
        name                      : String                            @title        : 'Name';
        alertType                 : types.TAlertType                  @title        : 'Measurement Type';
        levelScope                : types.TAggregationLevel           @title        : 'Filter Hierarchy';
        levelMode                 : types.TInExclude                  @title        : 'Filter Mode';
        levelItems                : Composition of many AlertLevelItems
                                        on levelItems.toAlert = $self;

        serviceScope              : types.TServiceScopes              @title        : 'Level of detail';
        serviceMode               : types.TInExclude                  @title        : 'Filter Mode';
        serviceItems              : Composition of many AlertServiceItems
                                        on serviceItems.toAlert = $self;

        thresholds                : Composition of many AlertThresholds
                                        on thresholds.toAlert = $self @title        : 'Thresholds';
        modifiedAt                : Timestamp                         @cds.on.insert: $now   @cds.on.update: $now   @title: 'Changed On';
        modifiedBy                : String(255)                       @cds.on.insert: $user  @cds.on.update: $user  @title: 'Changed By';
        virtual simulation        : types.TAlertSimulation;
}

entity AlertLevelItems {
    key toAlert : Association to Alerts;
    key itemID  : String  @Common.Text: toItem.name  @Common.TextArrangement: #TextOnly;
        toItem  : Association to one ManageAlertsService.LevelNames
                      on toItem.id = itemID;
}

entity AlertServiceItems {
    key toAlert : Association to Alerts;
    key itemID  : String  @Common.Text: toItem.name  @Common.TextArrangement: #TextOnly;
        toItem  : Association to one ManageAlertsService.ServiceAndMetricNames
                      on toItem.id = itemID;
}

entity AlertThresholds {
    key ID           : UUID                   @UI.Hidden  @Core.Computed;
    key toAlert      : Association to Alerts  @UI.Hidden;
        property     : String                 @title: 'Property';
        amount       : Decimal(20, 2)         @title: 'Amount';
        operator     : String(2) default '>=' @title: 'Operator';
        virtual text : String;
}


/**
 * Account structure and Tags
 */

entity AccountStructureItems {
    key ID                        : String                         @title: 'ID';
        parentID                  : String                         @title: 'Parent ID';
        toParent                  : Association to one AccountStructureItems
                                        on toParent.ID = parentID;
        treeLevel                 : Integer                        @UI.Hidden;
        treeState                 : String default 'expanded'      @UI.Hidden;
        region                    : String                         @title: 'Region';
        environment               : String                         @title: 'Env';
        name                      : String                         @title: 'Name';
        level                     : types.TAccountStructureLevels  @title: 'Type';
        excluded                  : Boolean default false          @title: 'Exclude';
        lifecycle                 : String default 'Unset'         @title: 'Lifecycle';
        virtual tagTextManaged0   : String                         @title: 'Lines of Business';
        virtual tagTextManaged1   : String                         @title: 'Cost Centers';
        virtual tagTextManaged2   : String                         @title: 'placeholder 2';
        virtual tagTextManaged3   : String                         @title: 'placeholder 3';
        virtual tagTextManaged4   : String                         @title: 'placeholder 4';
        virtual tagTextManaged5   : String                         @title: 'placeholder 5';
        virtual tagTextManaged6   : String                         @title: 'placeholder 6';
        virtual tagTextManaged7   : String                         @title: 'placeholder 7';
        virtual tagTextManaged8   : String                         @title: 'placeholder 8';
        virtual tagTextManaged9   : String                         @title: 'placeholder 9';
        virtual tagTextCustomTags : String                         @title: 'Custom Tags';
        managedTagAllocations     : Composition of many ManagedTagAllocations
                                        on managedTagAllocations.toAccountStructureItem = $self;
        customTags                : Composition of many CustomTags
                                        on customTags.toAccountStructureItem = $self;
        label                     : String = level || ': ' || name @title: 'Hierarchy';
        icon                      : String = (level = 'Customer' ? 'sap-icon://account' : (level = 'Global Account' ? 'sap-icon://world' : (level = 'Directory' ? 'sap-icon://folder-blank' : (level = 'Datacenter' ? 'sap-icon://building' : (level = 'Sub Account' ? 'sap-icon://product' : (level = 'Space' ? 'sap-icon://cloud' : (level = 'Environment' ? 'sap-icon://it-host' : (level = 'Service' ? 'sap-icon://action-settings' : (level = 'Service (alloc.)' ? 'sap-icon://settings' : (level = 'Instance' ? 'sap-icon://tri-state' : ('sap-icon://question-mark'))))))))))) stored;
}

entity ManagedTagAllocations {
    key ID                     : UUID                          @Core.Computed       @title: 'Tag ID';
        toAccountStructureItem : Association to AccountStructureItems;
        name                   : String                        @title        : 'Name';
        value                  : String                        @title        : 'Value';
        pct                    : Integer default 100 not null  @Measures.Unit: '%'  @title: 'Pct.'  @assert.range: [
            0,
            100
        ];
}

entity CustomTags {
    key ID                     : UUID   @Core.Computed;
        toAccountStructureItem : Association to AccountStructureItems;
        name                   : String @title: 'Name';
        value                  : String @title: 'Value';
}


/**
 * Contract credits information
 */

// Raw API data
entity CloudCreditsDetailsResponseObjects {
    key globalAccountId   : String;
        globalAccountName : String;
        contracts         : Composition of many ContractResponseObjects
                                on contracts.toCloudCreditsDetailsResponseObject = $self;
        valueUpdates      : Composition of many ContractCreditValues
                                on valueUpdates.toParent = $self;
}

// Raw API data
entity ContractResponseObjects {
    key ID                                  : UUID @Core.Computed;
        toCloudCreditsDetailsResponseObject : Association to CloudCreditsDetailsResponseObjects;
        contractStartDate                   : String;
        contractEndDate                     : String;
        currency                            : String;
        phases                              : Composition of many PhasesResponseObjects
                                                  on phases.toContractResponseObject = $self;
}

// Raw API data
entity PhasesResponseObjects {
    key toContractResponseObject : Association to ContractResponseObjects;
    key phaseStartDate           : String;
        phaseEndDate             : String;
        phaseUpdates             : Composition of many PhaseUpdates
                                       on phaseUpdates.toPhasesResponseObject = $self;
}

// Raw API data
entity PhaseUpdates {
    key ID                     : UUID default SYSUUID() @Core.Computed;
        toPhasesResponseObject : Association to PhasesResponseObjects;
        balance                : Decimal(20, 2);
        cloudCreditsForPhase   : Decimal(20, 2);
        phaseUpdatedOn         : String;
}

// Generated actual values from raw API data
entity ContractCreditValues {
    key toParent             : Association to CloudCreditsDetailsResponseObjects;
    key yearMonth            : String;
        contractStartDate    : Date;
        contractEndDate      : Date;
        currency             : String;
        phaseStartDate       : Date;
        phaseEndDate         : Date;
        phaseUpdatedOn       : Date;
        cloudCreditsForPhase : Decimal(20, 2);
        balance              : Decimal(20, 2);
        status               : types.TCreditStatus;
}


/**
 * Code lists
 */

entity CodeLists {
    key list        : String @UI.Hidden;
    key code        : String @title: 'Item';
    key context     : String;
        description : String @title: 'Description';
}

namespace db;

using types from './types';

entity BTPServices {
    key reportYearMonth                : String          @title        : 'Month';
    key serviceName                    : String          @title        : 'Service';
    key retrieved                      : Date            @title        : 'Date';
    key interval                       : types.TInterval @title        : 'Reading';
        lastSynced                     : DateTime        @cds.on.insert: $now  @cds.on.update: $now;
        virtual namesCommercialMetrics : String          @Core.Computed;

        // Used to display History on the Object Page
        history                        : Association to many BTPServices
                                             on history.serviceName = serviceName;

        // Composition onlhy used to leverage delete cascade
        _commercialMetricsComposition  : Composition of many CommercialMetrics
                                             on _commercialMetricsComposition.toService = $self;
        _technicalMetricsComposition   : Composition of many TechnicalMetrics
                                             on _technicalMetricsComposition.toService = $self;

        // Used to display list of Metrics in Object Page. Composition to leverage delete cascade
        commercialMetrics              : Association to many CommercialMetrics
                                             on  commercialMetrics.toService  =  $self
                                             and commercialMetrics.metricName <> '_combined_';
        commercialMetricsHistory       : Association to many CommercialMetrics
                                             on  commercialMetricsHistory.toService.serviceName =  serviceName
                                             and commercialMetricsHistory.metricName            <> '_combined_';

        // Used to display list of Metrics in Object Page. Composition to leverage delete cascade
        technicalMetrics               : Association to many TechnicalMetrics
                                             on  technicalMetrics.toService  =  $self
                                             and technicalMetrics.metricName <> '_combined_';
        technicalMetricsHistory        : Association to many TechnicalMetrics
                                             on  technicalMetricsHistory.toService.serviceName =  serviceName
                                             and technicalMetricsHistory.metricName            <> '_combined_';

        // Used in timeline chart in Object Page:
        cmHistoryByMetricAll           : Association to many CommercialMeasures
                                             on  cmHistoryByMetricAll.toMetric.toService.serviceName =  serviceName
                                             and cmHistoryByMetricAll.level                          =  'GlobalAccount'
                                             and cmHistoryByMetricAll.toMetric.metricName            <> '_combined_';
        cmHistoryByMetricDaily         : Association to many CommercialMeasures
                                             on  cmHistoryByMetricDaily.toMetric.toService.serviceName =  serviceName
                                             and cmHistoryByMetricDaily.toMetric.toService.interval    =  'Daily'
                                             and cmHistoryByMetricDaily.level                          =  'GlobalAccount'
                                             and cmHistoryByMetricDaily.toMetric.metricName            <> '_combined_';
        cmHistoryByMetricMonthly       : Association to many CommercialMeasures
                                             on  cmHistoryByMetricMonthly.toMetric.toService.serviceName =  serviceName
                                             and cmHistoryByMetricMonthly.toMetric.toService.interval    =  'Monthly'
                                             and cmHistoryByMetricMonthly.level                          =  'GlobalAccount'
                                             and cmHistoryByMetricMonthly.toMetric.metricName            <> '_combined_';

        // Used to display the breakdowns per level on the Object Page:
        cmByMetricByLevel              : Association to many CommercialMeasures
                                             on  cmByMetricByLevel.toMetric.toService.reportYearMonth =  reportYearMonth
                                             and cmByMetricByLevel.toMetric.toService.retrieved       =  retrieved
                                             and cmByMetricByLevel.toMetric.toService.interval        =  interval
                                             and cmByMetricByLevel.toMetric.toService.serviceName     =  serviceName
                                             and cmByMetricByLevel.toMetric.metricName                <> '_combined_';
        tmByMetricByLevel              : Association to many TechnicalMeasures
                                             on  tmByMetricByLevel.toMetric.toService.reportYearMonth =  reportYearMonth
                                             and tmByMetricByLevel.toMetric.toService.retrieved       =  retrieved
                                             and tmByMetricByLevel.toMetric.toService.interval        =  interval
                                             and tmByMetricByLevel.toMetric.toService.serviceName     =  serviceName
                                             and tmByMetricByLevel.toMetric.metricName                <> '_combined_';

        // Used to display measures on the List View, and account name and measures and graphs on the Object Page:
        cmByLevel                      : Association to many CommercialMeasures
                                             on  cmByLevel.toMetric.toService.reportYearMonth = reportYearMonth
                                             and cmByLevel.toMetric.toService.retrieved       = retrieved
                                             and cmByLevel.toMetric.toService.interval        = interval
                                             and cmByLevel.toMetric.toService.serviceName     = serviceName
                                             and cmByLevel.toMetric.metricName                = '_combined_';
        tmByLevel                      : Association to many TechnicalMeasures
                                             on  tmByLevel.toMetric.toService.reportYearMonth = reportYearMonth
                                             and tmByLevel.toMetric.toService.retrieved       = retrieved
                                             and tmByLevel.toMetric.toService.interval        = interval
                                             and tmByLevel.toMetric.toService.serviceName     = serviceName
                                             and tmByLevel.toMetric.metricName                = '_combined_';
}

entity CommercialMetrics {
    key toService          :      Association to BTPServices;
    key metricName         :      String     @title: 'Metric'; // equals to '_combined_' in case multiple metrics are summed up
        tags               : many types.TTag @title: 'Tags';
        virtual tagStrings :      String     @title: 'Tags';
        forecastSetting    :      Association to one ForecastSettings
                                      on  forecastSetting.serviceName = toService.serviceName
                                      and forecastSetting.metricName  = metricName;

        // Used to display measures on the Service Object Page and Metric Object Page
        commercialMeasures :      Composition of many CommercialMeasures
                                      on commercialMeasures.toMetric = $self;

        // Used to display History on the Object Page
        history            :      Association to many CommercialMetrics
                                      on  history.toService.serviceName = toService.serviceName
                                      and history.metricName            = metricName;
}

entity TechnicalMetrics {
    key toService          :      Association to BTPServices;
    key metricName         :      String     @title: 'Metric'; // equals to '_combined_' in case multiple metrics are summed up
        tags               : many types.TTag @title: 'Tags';
        virtual tagStrings :      String     @title: 'Tags';

        // Used to display measures on the Service Object Page and Metric Object Page
        technicalMeasures  :      Composition of many TechnicalMeasures
                                      on technicalMeasures.toMetric = $self;

        // Used to display History on the Object Page
        history            :      Association to many TechnicalMetrics
                                      on  history.toService.serviceName = toService.serviceName
                                      and history.metricName            = metricName;
}

entity CommercialMeasures {
    key toMetric                         : Association to CommercialMetrics;
    key level                            : types.TAggregationLevel      @title: 'Level';
    key name                             : String                       @title: 'Name';
        currency                         : String                       @title: 'Currency';
        unit                             : String                       @title: 'Unit';
        measure                          : {
            cost                 : Decimal(20, 2)                       @title: 'Cost'                               @Measures.ISOCurrency: currency;
            usage                : Decimal(20, 2)                       @title: 'Usage';
            actualUsage          : Decimal(20, 2)                       @title: 'Actual Usage';
            chargedBlocks        : Decimal(20, 2)                       @title: 'Charged Blocks';
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

        // Used as quick link for the forecast calculation
        forecastSetting                  : Association to one ForecastSettings
                                               on  forecastSetting.serviceName = toMetric.toService.serviceName
                                               and forecastSetting.metricName  = toMetric.metricName;
}

entity TechnicalMeasures {
    key toMetric                        : Association to TechnicalMetrics;
    key level                           : types.TAggregationLevel @title: 'Level';
    key name                            : String                  @title: 'Name';
        unit                            : String                  @title: 'Unit';
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
}

entity ForecastSettings {
    key serviceName      : String                @title: 'Service';
    key metricName       : String                @title: 'Metric';
        method           : types.TForecastMethod @title: 'Method';
        /**
         * Zero or positive number indicating the rate of continued usage:
         * - 0: Same as 'excluded'
         * - < 1: the usage of the remaining days will be lower than the usage of the past days (degressive)
         * - = 1: the usage of the remaining days will be similar to the usage of the past days (linear)
         * - \> 1: the usage of the remaining days will be higher than the usage of the past days (progressive)
         */
        degressionFactor : Double                @title: 'Degression Factor';
        statusText       : String = case
                                        when
                                            (
                                                method = 'Excluded'
                                            )
                                        then
                                            'Not Forecasted'
                                        when
                                            (
                                                method = 'TimeDegressive'
                                            )
                                        then
                                            method || ' (' || degressionFactor || 'x)'
                                        else
                                            method
                                    end          @title: 'Forecast Relevance';
}

entity Alerts {
    key ID                        :      UUID                              @UI.Hidden             @Core.Computed;
        active                    :      Boolean default true              @title        : 'Enabled';
        virtual activeCriticality :      Integer;
        name                      :      String                            @title        : 'Name';
        alertType                 :      types.TAlertType                  @title        : 'Measurement Type';
        levelScope                :      types.TAggregationLevel           @title        : 'Filter Hierarchy';
        levelMode                 :      types.TInExclude                  @title        : 'Filter Mode';
        levelItems                : many String;
        virtual levelItemsText    :      String                            @title        : 'Filter Items';
        serviceScope              :      types.TServiceScopes              @title        : 'Level of detail';
        serviceMode               :      types.TInExclude                  @title        : 'Filter Mode';
        serviceItems              : many String;
        virtual serviceItemsText  :      String                            @title        : 'Filter Items';
        thresholds                :      Composition of many AlertThresholds
                                             on thresholds.toAlert = $self @title        : 'Thresholds';
        modifiedAt                :      Timestamp                         @cds.on.insert: $now   @cds.on.update: $now   @title: 'Changed On';
        modifiedBy                :      String(255)                       @cds.on.insert: $user  @cds.on.update: $user  @title: 'Changed By';
}


entity AlertThresholds {
    key ID           : UUID                   @UI.Hidden  @Core.Computed;
    key toAlert      : Association to Alerts  @UI.Hidden;
        property     : String                 @title: 'Property';
        amount       : Decimal(20, 2)         @title: 'Amount';
        operator     : String(2) default '>=' @title: 'Operator';
        virtual text : String;
}

entity CodeLists {
    key list        : String @UI.Hidden;
    key code        : String @title: 'Item';
        description : String @title: 'Description';
}

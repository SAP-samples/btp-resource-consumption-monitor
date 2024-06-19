using PresentationService as service from '../../srv/presentationService';

annotate service.CommercialMeasures with @(
    Aggregation.ApplySupported                     : {
        Transformations       : [
            'aggregate',
            'topcount',
            'bottomcount',
            'identity',
            'concat',
            'groupby',
            'filter',
            'top',
            'skip',
            'orderby',
            'search'
        ],
        Rollup                : #SingleHierarchy,
        GroupableProperties   : [
            metricName,
            retrieved,
            name,
            interval
        ],
        AggregatableProperties: [
            {Property: measure_cost},
            {Property: forecast_cost},
            {Property: measure_usage}
        ]
    },
    Analytics.AggregatedProperty #SUM_measure_cost : {
        Name                : 'SUM_measure_cost',
        AggregationMethod   : 'sum',
        AggregatableProperty: measure_cost
    },
    Analytics.AggregatedProperty #SUM_forecast_cost: {
        Name                : 'SUM_forecast_cost',
        AggregationMethod   : 'sum',
        AggregatableProperty: forecast_cost
    },
    Analytics.AggregatedProperty #SUM_measure_usage: {
        Name                : 'SUM_measure_usage',
        AggregationMethod   : 'sum',
        AggregatableProperty: measure_usage
    },
    UI                                             : {
        Chart #MetricBulletChart                         : {
            $Type            : 'UI.ChartDefinitionType',
            Title            : 'Chart',
            Description      : 'Cost, Forecast',
            ChartType        : #Bullet,
            Measures         : [measure_cost],
            MeasureAttributes: [{
                Measure  : measure_cost,
                Role     : #Axis1,
                DataPoint: '@UI.DataPoint#BulletDP'
            }]
        },
        DataPoint #BulletDP                              : {
            $Type        : 'UI.DataPointType',
            Value        : costChart_value,
            MinimumValue : costChart_min,
            MaximumValue : costChart_max,
            TargetValue  : costChart_target,
            ForecastValue: costChart_forecast,
            Criticality  : costChart_criticality
        },
        Chart #ComparisonBySubAccount                    : {
            $Type            : 'UI.ChartDefinitionType',
            Title            : 'By Sub Account',
            Description      : 'Cost this month',
            ChartType        : #Bar,
            Dimensions       : [name],
            Measures         : [measure_cost],
            MeasureAttributes: [{
                Measure  : measure_cost,
                Role     : #Axis1,
                DataPoint: '@UI.DataPoint#measure_cost'
            }]
        },
        Chart #ComparisonByDirectory                     : {
            $Type            : 'UI.ChartDefinitionType',
            Title            : 'By Directory',
            Description      : 'Cost this month',
            ChartType        : #Bar,
            Dimensions       : [name],
            Measures         : [measure_cost],
            DynamicMeasures  : ['@Analytics.AggregatedProperty#SUM_measure_cost'],
            MeasureAttributes: [{
                Measure  : measure_cost,
                Role     : #Axis1,
                DataPoint: '@UI.DataPoint#measure_cost'
            }]
        },
        Chart #ComparisonByGlobalAccount                 : {
            $Type            : 'UI.ChartDefinitionType',
            Title            : 'By Global Account',
            Description      : 'Cost this month',
            ChartType        : #Bar,
            Dimensions       : [name],
            Measures         : [measure_cost],
            DynamicMeasures  : ['@Analytics.AggregatedProperty#SUM_measure_cost'],
            MeasureAttributes: [{
                Measure  : measure_cost,
                Role     : #Axis1,
                DataPoint: '@UI.DataPoint#measure_cost'
            }]
        },
        DataPoint #measure_cost                          : {
            $Type: 'UI.DataPointType',
            Value: measure_cost
        },
        PresentationVariant #HistoricMeasuresAllTimeChart: {
            $Type         : 'UI.PresentationVariantType',
            Visualizations: ['@UI.Chart#HistoricMeasuresAllTimeChart'],
            SortOrder     : [
                {Property: retrieved},
                {Property: interval}
            ]
        },
        Chart #HistoricMeasuresAllTimeChart              : {
            $Type              : 'UI.ChartDefinitionType',
            Title              : 'Cost over time (Monthly and Daily values combined)',
            ChartType          : #CombinationStackedDual, //#CombinationDual
            Dimensions         : [
                retrieved,
                interval,
            // metricName,
            ],
            DimensionAttributes: [
                {
                    $Type    : 'UI.ChartDimensionAttributeType',
                    Dimension: retrieved,
                    Role     : #Category
                },
                {
                    $Type    : 'UI.ChartDimensionAttributeType',
                    Dimension: metricName,
                    Role     : #Series
                },
                {
                    $Type    : 'UI.ChartDimensionAttributeType',
                    Dimension: interval,
                    Role     : #Category
                }
            ],
            DynamicMeasures    : [
                '@Analytics.AggregatedProperty#SUM_measure_cost',
                '@Analytics.AggregatedProperty#SUM_forecast_cost',
                '@Analytics.AggregatedProperty#SUM_measure_usage',
            ],
            MeasureAttributes  : [
                {
                    $Type         : 'UI.ChartMeasureAttributeType',
                    DynamicMeasure: '@Analytics.AggregatedProperty#SUM_measure_cost',
                    Role          : #Axis1
                },
                {
                    $Type         : 'UI.ChartMeasureAttributeType',
                    DynamicMeasure: '@Analytics.AggregatedProperty#SUM_forecast_cost',
                    Role          : #Axis1
                },
                {
                    $Type         : 'UI.ChartMeasureAttributeType',
                    DynamicMeasure: '@Analytics.AggregatedProperty#SUM_measure_usage',
                    Role          : #Axis2
                }
            ]
        },
        PresentationVariant #HistoricMeasuresChart       : {
            $Type         : 'UI.PresentationVariantType',
            Visualizations: ['@UI.Chart#HistoricMeasuresChart'],
            SortOrder     : [{Property: retrieved}]
        },
        Chart #HistoricMeasuresChart                     : {
            $Type              : 'UI.ChartDefinitionType',
            Title              : 'Cost per metric over time',
            ChartType          : #CombinationStackedDual, //#CombinationDual
            Dimensions         : [
                retrieved,
                metricName
            ],
            DimensionAttributes: [
                {
                    $Type    : 'UI.ChartDimensionAttributeType',
                    Dimension: retrieved,
                    Role     : #Category
                },
                {
                    $Type    : 'UI.ChartDimensionAttributeType',
                    Dimension: metricName,
                    Role     : #Series
                }
            ],
            DynamicMeasures    : [
                '@Analytics.AggregatedProperty#SUM_measure_cost',
                '@Analytics.AggregatedProperty#SUM_forecast_cost',
                '@Analytics.AggregatedProperty#SUM_measure_usage',
            ],
            MeasureAttributes  : [
                {
                    $Type         : 'UI.ChartMeasureAttributeType',
                    DynamicMeasure: '@Analytics.AggregatedProperty#SUM_measure_cost',
                    Role          : #Axis1
                },
                {
                    $Type         : 'UI.ChartMeasureAttributeType',
                    DynamicMeasure: '@Analytics.AggregatedProperty#SUM_forecast_cost',
                    Role          : #Axis1
                },
                {
                    $Type         : 'UI.ChartMeasureAttributeType',
                    DynamicMeasure: '@Analytics.AggregatedProperty#SUM_measure_usage',
                    Role          : #Axis2
                }
            ]
        }
    }
);

annotate service.TechnicalMeasures with @(
    Aggregation.ApplySupported                     : {
        Transformations       : [
            'aggregate',
            'topcount',
            'bottomcount',
            'identity',
            'concat',
            'groupby',
            'filter',
            'top',
            'skip',
            'orderby',
            'search'
        ],
        Rollup                : #SingleHierarchy,
        GroupableProperties   : [
            metricName,
            retrieved,
            name
        ],
        AggregatableProperties: [{Property: measure_usage}]
    },
    Analytics.AggregatedProperty #SUM_measure_usage: {
        Name                : 'SUM_measure_usage',
        AggregationMethod   : 'sum',
        AggregatableProperty: measure_usage
    },
    UI                                             : {
        Chart #ComparisonBySubAccount   : {
            $Type            : 'UI.ChartDefinitionType',
            Title            : 'By Sub Account',
            Description      : 'Usage this month',
            ChartType        : #Bar,
            Dimensions       : [name],
            Measures         : [measure_usage],
            MeasureAttributes: [{
                Measure  : measure_usage,
                Role     : #Axis1,
                DataPoint: '@UI.DataPoint#measure_usage'
            }]
        },
        Chart #ComparisonByDirectory    : {
            $Type            : 'UI.ChartDefinitionType',
            Title            : 'By Directory',
            Description      : 'Usage this month',
            ChartType        : #Bar,
            Dimensions       : [name],
            Measures         : [measure_usage],
            MeasureAttributes: [{
                Measure  : measure_usage,
                Role     : #Axis1,
                DataPoint: '@UI.DataPoint#measure_usage'
            }]
        },
        Chart #ComparisonByGlobalAccount: {
            $Type            : 'UI.ChartDefinitionType',
            Title            : 'By Global Account',
            Description      : 'Usage this month',
            ChartType        : #Bar,
            Dimensions       : [name],
            Measures         : [measure_usage],
            MeasureAttributes: [{
                Measure  : measure_usage,
                Role     : #Axis1,
                DataPoint: '@UI.DataPoint#measure_usage'
            }]
        },
        DataPoint #measure_usage        : {
            $Type: 'UI.DataPointType',
            Value: measure_usage
        }
    }
);

using PresentationService as service from '../../srv/presentationService';
using from './annotations_Measures';
using from './charts';

annotate types.TSetForecastSettingParams with {
    method           @(Common: {
        Label                   : 'Choose forecasting method',
        ValueListWithFixedValues: true,
        ValueList               : {
            CollectionPath: 'CL_ForecastMethods',
            Parameters    : [{
                $Type            : 'Common.ValueListParameterInOut',
                ValueListProperty: 'code',
                LocalDataProperty: 'method'
            }]
        }
    });
    degressionFactor @(
        assert.range: [
            0,
            10
        ],
        Common.Label: 'Set degression factor'
    )
}

annotate types.TSetTechnicalMetricForAllocationParams with {
    tMeasureId @Common.Label: 'Select Technical Metric or set empty value to remove allocation';
}

// List Views
annotate service.CommercialMetrics with @(UI: {
    PresentationVariant #ServiceEmbeddedMetricsTable       : {
        $Type         : 'UI.PresentationVariantType',
        Visualizations: ['@UI.LineItem#ServiceEmbeddedMetricsTable'],
        SortOrder     : [{Property: metricName}]
    },
    LineItem #ServiceEmbeddedMetricsTable                  : [
        {
            Value                : toService.retrieved,
            ![@HTML5.CssDefaults]: {width: '8rem'}
        },
        {
            Value                : toService.reportYearMonth,
            ![@HTML5.CssDefaults]: {width: '5rem'}
        },
        {
            Value                : metricName,
            ![@HTML5.CssDefaults]: {width: '19rem'}
        },
        {
            Value                : cmByCustomer.measure_cost,
            ![@HTML5.CssDefaults]: {width: '11rem'}
        },
        {
            Value                : cmByCustomer.delta_measure_cost,
            ![@HTML5.CssDefaults]: {width: '11rem'}
        },
        {
            $Type                : 'UI.DataFieldForAnnotation',
            Target               : 'cmByCustomer/@UI.Chart#MetricBulletChart',
            Label                : 'Chart',
            ![@HTML5.CssDefaults]: {width: '7rem'}
        },
        {
            Value                    : cmByCustomer.forecastPct,
            Criticality              : cmByCustomer.forecastPctCriticality,
            CriticalityRepresentation: #WithoutIcon,
            ![@HTML5.CssDefaults]    : {width: '6rem'},
            ![@UI.Hidden]            : (forecastSetting.method = 'Excluded')
        },
        {
            Value                : cmByCustomer.forecast_cost,
            ![@HTML5.CssDefaults]: {width: '11rem'}
        },
        {
            $Type                : 'UI.DataFieldWithAction',
            Label                : 'Forecasting Configuration',
            Value                : forecastSetting.statusText,
            Action               : 'PresentationService.SetForecastSetting',
            ![@HTML5.CssDefaults]: {width: '11rem'}
        },
        {
            $Type                : 'UI.DataFieldWithAction',
            Label                : 'Technical Allocation',
            Value                : technicalMetricForAllocation.metricName,
            Action               : 'PresentationService.SetTechnicalMetricForAllocation',
            ![@UI.Hidden]        : hideCommercialSpaceAllocation,
            ![@HTML5.CssDefaults]: {width: '11rem'}
        },
        {
            Value                : cmByCustomer.measure_usage,
            ![@HTML5.CssDefaults]: {width: '8rem'}
        },
        {
            Value                : cmByCustomer.unit,
            ![@HTML5.CssDefaults]: {width: '12rem'}
        },
        {
            Value                : cmByCustomer.plans,
            ![@HTML5.CssDefaults]: {width: '14rem'}
        }
    ],
    PresentationVariant #ServiceEmbeddedHistory            : {
        $Type         : 'UI.PresentationVariantType',
        Text          : 'Current Month',
        Visualizations: ['@UI.LineItem#ServiceEmbeddedHistory'],
        GroupBy       : [metricName],
        SortOrder     : [
            {Property: metricName},
            {
                Property  : toService.retrieved,
                Descending: true
            },
            {Property: toService.interval}
        ]
    },
    PresentationVariant #ServiceEmbeddedHistorySingleMetric: {
        $Type         : 'UI.PresentationVariantType',
        Visualizations: ['@UI.LineItem#ServiceEmbeddedHistory'],
        SortOrder     : [
            {
                Property  : toService.retrieved,
                Descending: true
            },
            {Property: toService.interval}
        ]
    },
    LineItem #ServiceEmbeddedHistory                       : [
        {
            Value                : toService.retrieved,
            ![@HTML5.CssDefaults]: {width: '8rem'}
        },
        {
            Value                : toService.reportYearMonth,
            ![@HTML5.CssDefaults]: {width: '5rem'}
        },
        {
            Value                : toService.interval,
            ![@HTML5.CssDefaults]: {width: '6rem'}
        },
        {
            Value                : metricName,
            ![@HTML5.CssDefaults]: {width: '19rem'}
        },
        {
            Value                : cmByCustomer.measure_cost,
            ![@HTML5.CssDefaults]: {width: '11rem'}
        },
        {
            Value                : cmByCustomer.delta_measure_cost,
            ![@HTML5.CssDefaults]: {width: '11rem'}
        },
        {
            Value                : cmByCustomer.forecast_cost,
            ![@HTML5.CssDefaults]: {width: '11rem'}
        },
        {
            Value                : cmByCustomer.measure_usage,
            ![@HTML5.CssDefaults]: {width: '8rem'}
        },
        {
            Value                : cmByCustomer.delta_measure_usage,
            ![@HTML5.CssDefaults]: {width: '8rem'}
        },
        {
            Value                : cmByCustomer.measure_actualUsage,
            ![@HTML5.CssDefaults]: {width: '8rem'}
        },
        {
            Value                : cmByCustomer.measure_chargedBlocks,
            ![@HTML5.CssDefaults]: {width: '8rem'}
        },
        {
            Value                : cmByCustomer.measure_cloudCreditsCost,
            ![@HTML5.CssDefaults]: {width: '11rem'}
        },
        {
            Value                : cmByCustomer.measure_paygCost,
            ![@HTML5.CssDefaults]: {width: '11rem'}
        },
        {
            Value                : cmByCustomer.unit,
            ![@HTML5.CssDefaults]: {width: '12rem'}
        },
        {
            Value                : cmByCustomer.plans,
            ![@HTML5.CssDefaults]: {width: '14rem'}
        },
        {
            $Type                : 'UI.DataFieldForAction',
            Label                : 'Delete',
            Action               : 'PresentationService.deleteCommercialMetric',
            IconUrl              : 'sap-icon://delete',
            Inline               : true,
            ![@HTML5.CssDefaults]: {width: '4rem'},
            ![@UI.Importance]    : #High
        }
    ]
});

//Object Page
annotate service.CommercialMetrics with @(UI: {
    HeaderInfo               : {
        $Type         : 'UI.HeaderInfoType',
        TypeName      : 'Metric',
        TypeNamePlural: 'Metrics',
        Title         : {Value: metricName},
        Description   : {Value: 'Commercial Metric'},
        ImageUrl      : 'sap-icon://expense-report'
    },
    HeaderFacets             : [
        {
            $Type : 'UI.ReferenceFacet',
            Target: '@UI.FieldGroup#Metadata',
            Label : 'Metric Details'
        },
        {
            $Type : 'UI.ReferenceFacet',
            Target: '@UI.FieldGroup#CostThisMonth',
            Label : 'Cost For This Month'
        },
        {
            $Type : 'UI.ReferenceFacet',
            Target: 'cmByCustomer/@UI.Chart#MetricBulletChart'
        },
        {
            $Type : 'UI.ReferenceFacet',
            Target: '@UI.FieldGroup#DeltaChange',
            Label : 'Daily Change'
        },
        {
            $Type        : 'UI.ReferenceFacet',
            Target       : 'cmByGlobalAccount/@UI.Chart#ComparisonByGlobalAccount',
            ![@UI.Hidden]: hideGlobalAccountDistribution
        },
        {
            $Type : 'UI.ReferenceFacet',
            Target: 'cmByDirectory/@UI.Chart#ComparisonByDirectory'
        },
        {
            $Type : 'UI.ReferenceFacet',
            Target: 'cmBySubAccount/@UI.Chart#ComparisonBySubAccount'
        }
    ],
    Facets                   : [
        {
            $Type : 'UI.CollectionFacet',
            ID    : 'breakdown',
            Label : 'Breakdown',
            Facets: [
                {
                    // Needed to trick rendering the below tables with collapsed header (see UI5 v1.121.1)
                    $Type        : 'UI.CollectionFacet',
                    ID           : 'placeholderBreakdown',
                    Facets       : [],
                    ![@UI.Hidden]: true
                },
                {
                    $Type        : 'UI.ReferenceFacet',
                    Label        : 'By Global Account',
                    Target       : 'cmByGlobalAccount/@UI.PresentationVariant#ServiceEmbeddedBreakdownSingleMetric',
                    ![@UI.Hidden]: hideGlobalAccountDistribution
                },
                {
                    $Type : 'UI.ReferenceFacet',
                    Label : 'By Directory',
                    Target: 'cmByDirectory/@UI.PresentationVariant#ServiceEmbeddedBreakdownSingleMetricGroupedByParentLabel'
                },
                {
                    $Type : 'UI.ReferenceFacet',
                    Label : 'By Sub Account',
                    Target: 'cmBySubAccount/@UI.PresentationVariant#ServiceEmbeddedBreakdownSingleMetricGroupedByParentLabel'
                },
                {
                    $Type        : 'UI.ReferenceFacet',
                    Label        : 'By Instance',
                    Target       : 'cmByInstance/@UI.PresentationVariant#ServiceEmbeddedBreakdownSingleMetricGroupedByDoubleParentLabel',
                    ![@UI.Hidden]: hideServiceInstanceDistribution
                },
                {
                    $Type        : 'UI.ReferenceFacet',
                    Label        : 'By Application',
                    Target       : 'cmByApplication/@UI.PresentationVariant#ServiceEmbeddedBreakdownSingleMetricGroupedByParentLabel',
                    ![@UI.Hidden]: hideServiceApplicationDistribution
                },
                {
                    $Type        : 'UI.ReferenceFacet',
                    Label        : 'By Space',
                    Target       : 'cmBySpace/@UI.PresentationVariant#ServiceEmbeddedBreakdownSingleMetricGroupedByParentLabel',
                    ![@UI.Hidden]: hideCommercialSpaceAllocation
                },
                {
                    $Type : 'UI.ReferenceFacet',
                    Label : 'By Datacenter',
                    Target: 'cmByDatacenter/@UI.PresentationVariant#ServiceEmbeddedBreakdownSingleMetric'
                }
            ]
        },
        {
            $Type : 'UI.ReferenceFacet',
            Label : 'History',
            Target: 'history/@UI.PresentationVariant#ServiceEmbeddedHistorySingleMetric'
        },
        {
            $Type : 'UI.ReferenceFacet',
            Target: '@UI.FieldGroup#Tags',
            Label : 'Platform Tags'
        }
    ],
    FieldGroup #Metadata     : {Data: [
        {Value: measureId},
        {Value: toService.retrieved},
        {Value: cmByCustomer.plans}
    ]},
    FieldGroup #Tags         : {Data: [{Value: tagStrings}]},
    FieldGroup #CostThisMonth: {Data: [
        {
            Value: cmByCustomer.measure_cost,
            Label: 'Cost to date'
        },
        {Value: cmByCustomer.measure_cloudCreditsCost},
        {Value: cmByCustomer.measure_paygCost},
        {
            Value: cmByCustomer.max_cost,
            Label: 'Monthly maximum'
        },
        {
            Value: cmByCustomer.forecast_cost,
            Label: 'Forecasted this month'
        },
        {
            Value: cmByCustomer.forecastPct,
            Label: 'Forecasted vs maximum'
        }
    ]},
    FieldGroup #DeltaChange  : {Data: [
        {
            Value                    : cmByCustomer.delta_measure_costPct,
            Criticality              : cmByCustomer.deltaActualsCriticality,
            CriticalityRepresentation: #WithoutIcon,
            Label                    : 'Cost change'
        },
        {
            Value                    : cmByCustomer.delta_measure_cost,
            Criticality              : cmByCustomer.deltaActualsCriticality,
            CriticalityRepresentation: #WithoutIcon,
            Label                    : 'Cost change'
        },
        {
            Value                    : cmByCustomer.delta_measure_usagePct,
            Criticality              : cmByCustomer.deltaActualsCriticality,
            CriticalityRepresentation: #WithoutIcon,
            Label                    : 'Usage change'
        },
        {
            Value                    : cmByCustomer.delta_measure_usage,
            Criticality              : cmByCustomer.deltaActualsCriticality,
            CriticalityRepresentation: #WithoutIcon,
            Label                    : 'Usage change'
        },
        {
            Value                    : cmByCustomer.delta_forecast_costPct,
            Criticality              : cmByCustomer.deltaForecastCriticality,
            CriticalityRepresentation: #WithoutIcon,
            Label                    : 'Forecast change'
        },
        {
            Value                    : cmByCustomer.delta_forecast_cost,
            Criticality              : cmByCustomer.deltaForecastCriticality,
            CriticalityRepresentation: #WithoutIcon,
            Label                    : 'Forecast change'
        },
    ]}
});

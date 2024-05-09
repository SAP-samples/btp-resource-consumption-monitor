using PresentationService as service from '../../srv/presentationService';
using from './annotations_Measures';
using from './charts';

// List Views
annotate service.CommercialMetrics with @(UI: {
    PresentationVariant #ServiceEmbeddedMetricsTable       : {
        $Type         : 'UI.PresentationVariantType',
        Visualizations: ['@UI.LineItem#ServiceEmbeddedMetricsTable'],
        SortOrder     : [{Property: metricName}],
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
            Value                : cmByGlobalAccount.measure_cost,
            ![@HTML5.CssDefaults]: {width: '11rem'}
        },
        {
            Value                : cmByGlobalAccount.delta_measure_cost,
            ![@HTML5.CssDefaults]: {width: '11rem'}
        },
        {
            $Type                : 'UI.DataFieldForAnnotation',
            Target               : 'cmByGlobalAccount/@UI.Chart#MetricBulletChart',
            Label                : 'Chart',
            ![@HTML5.CssDefaults]: {width: '7rem'}
        },
        {
            Value                    : cmByGlobalAccount.forecastPct,
            Criticality              : cmByGlobalAccount.forecastPctCriticality,
            CriticalityRepresentation: #WithoutIcon,
            ![@HTML5.CssDefaults]    : {width: '6rem'},
            ![@UI.Hidden]            : {$edmJson: {$Eq: [
                {$Path: 'forecastSetting/method'},
                'Excluded'
            ]}}
        },
        {
            Value                : cmByGlobalAccount.forecast_cost,
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
            Value                : cmByGlobalAccount.measure_usage,
            ![@HTML5.CssDefaults]: {width: '8rem'}
        },
        {
            Value                : cmByGlobalAccount.unit,
            ![@HTML5.CssDefaults]: {width: '12rem'}
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
            Value                : cmByGlobalAccount.measure_cost,
            ![@HTML5.CssDefaults]: {width: '11rem'}
        },
        {
            Value                : cmByGlobalAccount.delta_measure_cost,
            ![@HTML5.CssDefaults]: {width: '11rem'}
        },
        {
            Value                : cmByGlobalAccount.forecast_cost,
            ![@HTML5.CssDefaults]: {width: '11rem'}
        },
        {
            Value                : cmByGlobalAccount.measure_usage,
            ![@HTML5.CssDefaults]: {width: '8rem'}
        },
        {
            Value                : cmByGlobalAccount.delta_measure_usage,
            ![@HTML5.CssDefaults]: {width: '8rem'}
        },
        {
            Value                : cmByGlobalAccount.measure_actualUsage,
            ![@HTML5.CssDefaults]: {width: '8rem'}
        },
        {
            Value                : cmByGlobalAccount.measure_chargedBlocks,
            ![@HTML5.CssDefaults]: {width: '8rem'}
        },
        {
            Value                : cmByGlobalAccount.unit,
            ![@HTML5.CssDefaults]: {width: '12rem'}
        },
        {
            $Type                : 'UI.DataFieldForAction',
            Label                : 'Delete',
            Action               : 'PresentationService.deleteCommercialMetric',
            IconUrl              : 'sap-icon://delete',
            Inline               : true,
            ![@HTML5.CssDefaults]: {width: '4rem'}
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
            Target: 'cmByGlobalAccount/@UI.Chart#MetricBulletChart'
        },
        {
            $Type : 'UI.ReferenceFacet',
            Target: '@UI.FieldGroup#DeltaChange',
            Label : 'Daily Change'
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
                    $Type : 'UI.ReferenceFacet',
                    Label : 'By Directory',
                    Target: 'cmByDirectory/@UI.PresentationVariant#ServiceEmbeddedBreakdownSingleMetric'
                },
                {
                    $Type : 'UI.ReferenceFacet',
                    Label : 'By Sub Account',
                    Target: 'cmBySubAccount/@UI.PresentationVariant#ServiceEmbeddedBreakdownSingleMetric'
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
            Label : 'Tags'
        }
    ],
    FieldGroup #Metadata     : {Data: [
        {
            Value: cmByGlobalAccount.name,
            Label: 'Account'
        },
        {Value: toService.serviceName},
        {Value: toService.retrieved}
    ]},
    FieldGroup #Tags         : {Data: [{Value: tagStrings}]},
    FieldGroup #CostThisMonth: {Data: [
        {
            Value: cmByGlobalAccount.measure_cost,
            Label: 'Cost to date'
        },
        {
            Value: cmByGlobalAccount.max_cost,
            Label: 'Monthly maximum'
        },
        {
            Value: cmByGlobalAccount.forecast_cost,
            Label: 'Forecasted this month'
        },
        {
            Value: cmByGlobalAccount.forecastPct,
            Label: 'Forecasted vs maximum'
        }
    ]},
    FieldGroup #DeltaChange  : {Data: [
        {
            Value                    : cmByGlobalAccount.delta_measure_costPct,
            Criticality              : cmByGlobalAccount.deltaActualsCriticality,
            CriticalityRepresentation: #WithoutIcon,
            Label                    : 'Cost change'
        },
        {
            Value                    : cmByGlobalAccount.delta_measure_cost,
            Criticality              : cmByGlobalAccount.deltaActualsCriticality,
            CriticalityRepresentation: #WithoutIcon,
            Label                    : 'Cost change'
        },
        {
            Value                    : cmByGlobalAccount.delta_measure_usagePct,
            Criticality              : cmByGlobalAccount.deltaActualsCriticality,
            CriticalityRepresentation: #WithoutIcon,
            Label                    : 'Usage change'
        },
        {
            Value                    : cmByGlobalAccount.delta_measure_usage,
            Criticality              : cmByGlobalAccount.deltaActualsCriticality,
            CriticalityRepresentation: #WithoutIcon,
            Label                    : 'Usage change'
        },
        {
            Value                    : cmByGlobalAccount.delta_forecast_costPct,
            Criticality              : cmByGlobalAccount.deltaForecastCriticality,
            CriticalityRepresentation: #WithoutIcon,
            Label                    : 'Forecast change'
        },
        {
            Value                    : cmByGlobalAccount.delta_forecast_cost,
            Criticality              : cmByGlobalAccount.deltaForecastCriticality,
            CriticalityRepresentation: #WithoutIcon,
            Label                    : 'Forecast change'
        },
    ]}
});

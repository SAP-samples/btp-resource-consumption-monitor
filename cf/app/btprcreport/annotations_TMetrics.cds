using PresentationService as service from '../../srv/presentationService';
using from './annotations_Measures';
using from './charts';

// List Views
annotate service.TechnicalMetrics with @(UI: {
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
            ![@HTML5.CssDefaults]: {width: '30rem'}
        },
        {
            Value                : tmByCustomer.plans,
            ![@HTML5.CssDefaults]: {width: '14rem'}
        },
        {
            Value                : tmByCustomer.measure_usage,
            ![@HTML5.CssDefaults]: {width: '14rem'}
        },
        {
            Value                : tmByCustomer.delta_measure_usage,
            ![@HTML5.CssDefaults]: {width: '10rem'}
        },
        {
            Value                : tmByCustomer.unit,
            ![@HTML5.CssDefaults]: {width: '16rem'}
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
            ![@HTML5.CssDefaults]: {width: '8rem'}
        },
        {
            Value                : metricName,
            ![@HTML5.CssDefaults]: {width: '25rem'}
        },
        {
            Value                : tmByCustomer.plans,
            ![@HTML5.CssDefaults]: {width: '14rem'}
        },
        {
            Value                : tmByCustomer.measure_usage,
            ![@HTML5.CssDefaults]: {width: '14rem'}
        },
        {
            Value                : tmByCustomer.delta_measure_usage,
            ![@HTML5.CssDefaults]: {width: '10rem'}
        },
        {
            Value                : tmByCustomer.unit,
            ![@HTML5.CssDefaults]: {width: '12rem'}
        },
        {
            $Type                : 'UI.DataFieldForAction',
            Label                : 'Delete',
            Action               : 'PresentationService.deleteTechnicalMetric',
            IconUrl              : 'sap-icon://delete',
            Inline               : true,
            ![@HTML5.CssDefaults]: {width: '4rem'},
            ![@UI.Importance]    : #High
        }
    ]
});

//Object Page
annotate service.TechnicalMetrics with @(UI: {
    HeaderInfo                : {
        $Type         : 'UI.HeaderInfoType',
        TypeName      : 'Metric',
        TypeNamePlural: 'Metrics',
        Title         : {Value: metricName},
        Description   : {Value: 'Technical Metric'},
        ImageUrl      : 'sap-icon://settings'
    },
    HeaderFacets              : [
        {
            $Type : 'UI.ReferenceFacet',
            Target: '@UI.FieldGroup#Metadata',
            Label : 'Metric Details'
        },
        {
            $Type : 'UI.ReferenceFacet',
            Target: '@UI.FieldGroup#UsageThisMonth',
            Label : 'Usage For This Month'
        },
        {
            $Type : 'UI.ReferenceFacet',
            Target: '@UI.FieldGroup#DeltaChange',
            Label : 'Daily Change'
        },
        {
            $Type        : 'UI.ReferenceFacet',
            Target       : 'tmByGlobalAccount/@UI.Chart#ComparisonByGlobalAccount',
            ![@UI.Hidden]: hideGlobalAccountDistribution
        },
        {
            $Type : 'UI.ReferenceFacet',
            Target: 'tmByDirectory/@UI.Chart#ComparisonByDirectory'
        },
        {
            $Type : 'UI.ReferenceFacet',
            Target: 'tmBySubAccount/@UI.Chart#ComparisonBySubAccount'
        }
    ],
    Facets                    : [
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
                    Target       : 'tmByGlobalAccount/@UI.PresentationVariant#ServiceEmbeddedBreakdownSingleMetric',
                    ![@UI.Hidden]: hideGlobalAccountDistribution
                },
                {
                    $Type : 'UI.ReferenceFacet',
                    Label : 'By Directory',
                    Target: 'tmByDirectory/@UI.PresentationVariant#ServiceEmbeddedBreakdownSingleMetricGroupedByParentLabel'
                },
                {
                    $Type : 'UI.ReferenceFacet',
                    Label : 'By Sub Account',
                    Target: 'tmBySubAccount/@UI.PresentationVariant#ServiceEmbeddedBreakdownSingleMetricGroupedByParentLabel'
                },
                {
                    $Type        : 'UI.ReferenceFacet',
                    Label        : 'By Instance',
                    Target       : 'tmByInstance/@UI.PresentationVariant#ServiceEmbeddedBreakdownSingleMetricGroupedByDoubleParentLabel',
                    ![@UI.Hidden]: hideServiceInstanceDistribution
                },
                {
                    $Type : 'UI.ReferenceFacet',
                    Label : 'By Space',
                    Target: 'tmBySpace/@UI.PresentationVariant#ServiceEmbeddedBreakdownSingleMetricGroupedByParentLabel'
                },
                {
                    $Type : 'UI.ReferenceFacet',
                    Label : 'By Datacenter',
                    Target: 'tmByDatacenter/@UI.PresentationVariant#ServiceEmbeddedBreakdownSingleMetric'
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
    FieldGroup #Metadata      : {Data: [
        {Value: measureId},
        {Value: toService.retrieved},
        {Value: tmByCustomer.plans}
    ]},
    FieldGroup #Tags          : {Data: [{Value: tagStrings}]},
    FieldGroup #UsageThisMonth: {Data: [
        {
            Value: tmByCustomer.measure_usage,
            Label: 'Usage to date'
        },
        {Value: tmByCustomer.unit}
    ]},
    FieldGroup #DeltaChange   : {Data: [
        {
            Value                    : tmByCustomer.delta_measure_usagePct,
            Criticality              : tmByCustomer.deltaActualsCriticality,
            CriticalityRepresentation: #WithoutIcon,
            Label                    : 'Usage change'
        },
        {
            Value                    : tmByCustomer.delta_measure_usage,
            Criticality              : tmByCustomer.deltaActualsCriticality,
            CriticalityRepresentation: #WithoutIcon,
            Label                    : 'Usage change'
        }
    ]}
});

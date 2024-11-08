using PresentationService as service from '../../srv/presentationService';
using from './charts';

annotate service.CommercialMeasures with @(UI: {
    HeaderInfo                                                                         : {
        $Type         : 'UI.HeaderInfoType',
        TypeName      : 'Measure',
        TypeNamePlural: 'Measures'
    },
    PresentationVariant #ServiceEmbeddedBreakdown                                      : {
        $Type         : 'UI.PresentationVariantType',
        Visualizations: ['@UI.LineItem#ServiceEmbeddedBreakdown'],
        GroupBy       : [name],
        SortOrder     : [
            {Property: name},
            {Property: toMetric.metricName}
        ]
    },
    PresentationVariant #ServiceEmbeddedBreakdownSingleMetric                          : {
        $Type         : 'UI.PresentationVariantType',
        Visualizations: ['@UI.LineItem#ServiceEmbeddedBreakdown'],
        SortOrder     : [{Property: name}]
    },
    LineItem #ServiceEmbeddedBreakdown                                                 : [
        {
            Value                : name,
            ![@HTML5.CssDefaults]: {width: '15rem'}
        },
        {
            Value                : toMetric.metricName,
            ![@HTML5.CssDefaults]: {width: '19rem'}
        },
        {
            Value                : plans,
            ![@HTML5.CssDefaults]: {width: '14rem'}
        },
        {
            Value                : measure_cost,
            ![@HTML5.CssDefaults]: {width: '11rem'}
        },
        {
            Value                : delta_measure_cost,
            ![@HTML5.CssDefaults]: {width: '10rem'}
        },
        {
            Value                : measure_usage,
            ![@HTML5.CssDefaults]: {width: '8rem'}
        },
        {
            Value                : measure_actualUsage,
            ![@HTML5.CssDefaults]: {width: '8rem'}
        },
        {
            Value                : measure_chargedBlocks,
            ![@HTML5.CssDefaults]: {width: '8rem'}
        },
        {
            Value                : unit,
            ![@HTML5.CssDefaults]: {width: '12rem'}
        }
    ],
    PresentationVariant #ServiceEmbeddedBreakdownSingleMetricGroupedByParentLabel      : {
        $Type         : 'UI.PresentationVariantType',
        Visualizations: ['@UI.LineItem#ServiceEmbeddedBreakdownGroupedByParentLabel'],
        SortOrder     : [{Property: name}],
        GroupBy       : [accountStructureItem.toParent.label]
    },
    LineItem #ServiceEmbeddedBreakdownGroupedByParentLabel                             : [
        {
            Value                : name,
            ![@HTML5.CssDefaults]: {width: '15rem'}
        },
        {
            Value                : toMetric.metricName,
            ![@HTML5.CssDefaults]: {width: '19rem'}
        },
        {
            Value                : plans,
            ![@HTML5.CssDefaults]: {width: '14rem'}
        },
        {
            Value                : measure_cost,
            ![@HTML5.CssDefaults]: {width: '11rem'}
        },
        {
            Value                : delta_measure_cost,
            ![@HTML5.CssDefaults]: {width: '10rem'}
        },
        {
            Value                : measure_usage,
            ![@HTML5.CssDefaults]: {width: '8rem'}
        },
        {
            Value                : measure_actualUsage,
            ![@HTML5.CssDefaults]: {width: '8rem'}
        },
        {
            Value                : measure_chargedBlocks,
            ![@HTML5.CssDefaults]: {width: '8rem'}
        },
        {
            Value                : unit,
            ![@HTML5.CssDefaults]: {width: '12rem'}
        },
        {
            Value                : accountStructureItem.toParent.label,
            Label                : 'Parent',
            ![@HTML5.CssDefaults]: {width: '50rem'}, // Very wide so it falls off the screen and is 'hidden'
            ![@UI.Importance]    : #Low
        }
    ],
    PresentationVariant #ServiceEmbeddedBreakdownSingleMetricGroupedByDoubleParentLabel: {
        $Type         : 'UI.PresentationVariantType',
        Visualizations: ['@UI.LineItem#ServiceEmbeddedBreakdownGroupedByDoubleParentLabel'],
        SortOrder     : [{Property: name}],
        GroupBy       : [accountStructureItem.toParent.toParent.label]
    },
    LineItem #ServiceEmbeddedBreakdownGroupedByDoubleParentLabel                       : [
        {
            Value                : name,
            ![@HTML5.CssDefaults]: {width: '15rem'}
        },
        {
            Value                : toMetric.metricName,
            ![@HTML5.CssDefaults]: {width: '19rem'}
        },
        {
            Value                : plans,
            ![@HTML5.CssDefaults]: {width: '14rem'}
        },
        {
            Value                : measure_cost,
            ![@HTML5.CssDefaults]: {width: '11rem'}
        },
        {
            Value                : delta_measure_cost,
            ![@HTML5.CssDefaults]: {width: '10rem'}
        },
        {
            Value                : measure_usage,
            ![@HTML5.CssDefaults]: {width: '8rem'}
        },
        {
            Value                : measure_actualUsage,
            ![@HTML5.CssDefaults]: {width: '8rem'}
        },
        {
            Value                : measure_chargedBlocks,
            ![@HTML5.CssDefaults]: {width: '8rem'}
        },
        {
            Value                : unit,
            ![@HTML5.CssDefaults]: {width: '12rem'}
        },
        {
            Value                : accountStructureItem.toParent.toParent.label,
            Label                : 'Parent',
            ![@HTML5.CssDefaults]: {width: '50rem'}, // Very wide so it falls off the screen and is 'hidden'
            ![@UI.Importance]    : #Low
        }
    ]
});

annotate service.TechnicalMeasures with @(UI: {
    HeaderInfo                                                                         : {
        $Type         : 'UI.HeaderInfoType',
        TypeName      : 'Measure',
        TypeNamePlural: 'Measures'
    },
    PresentationVariant #ServiceEmbeddedBreakdown                                      : {
        $Type         : 'UI.PresentationVariantType',
        Visualizations: ['@UI.LineItem#ServiceEmbeddedBreakdown'],
        GroupBy       : [name],
        SortOrder     : [
            {Property: name},
            {Property: toMetric.metricName}
        ]
    },
    PresentationVariant #ServiceEmbeddedBreakdownSingleMetric                          : {
        $Type         : 'UI.PresentationVariantType',
        Visualizations: ['@UI.LineItem#ServiceEmbeddedBreakdown'],
        SortOrder     : [{Property: name}]
    },
    LineItem #ServiceEmbeddedBreakdown                                                 : [
        {
            Value                : name,
            ![@HTML5.CssDefaults]: {width: '15rem'}
        },
        {
            Value                : toMetric.metricName,
            ![@HTML5.CssDefaults]: {width: '30rem'}
        },
        {
            Value                : plans,
            ![@HTML5.CssDefaults]: {width: '14rem'}
        },
        {
            Value                : measure_usage,
            ![@HTML5.CssDefaults]: {width: '14rem'}
        },
        {
            Value                : delta_measure_usage,
            ![@HTML5.CssDefaults]: {width: '10rem'}
        },
        {
            Value                : unit,
            ![@HTML5.CssDefaults]: {width: '16rem'}
        }
    ],
    PresentationVariant #ServiceEmbeddedBreakdownSingleMetricGroupedByParentLabel      : {
        $Type         : 'UI.PresentationVariantType',
        Visualizations: ['@UI.LineItem#ServiceEmbeddedBreakdownGroupedByParentLabel'],
        SortOrder     : [{Property: name}],
        GroupBy       : [accountStructureItem.toParent.label]
    },
    LineItem #ServiceEmbeddedBreakdownGroupedByParentLabel                             : [
        {
            Value                : name,
            ![@HTML5.CssDefaults]: {width: '15rem'}
        },
        {
            Value                : toMetric.metricName,
            ![@HTML5.CssDefaults]: {width: '30rem'}
        },
        {
            Value                : plans,
            ![@HTML5.CssDefaults]: {width: '14rem'}
        },
        {
            Value                : measure_usage,
            ![@HTML5.CssDefaults]: {width: '14rem'}
        },
        {
            Value                : delta_measure_usage,
            ![@HTML5.CssDefaults]: {width: '10rem'}
        },
        {
            Value                : unit,
            ![@HTML5.CssDefaults]: {width: '16rem'}
        },
        {
            Value                : accountStructureItem.toParent.label,
            Label                : 'Parent',
            ![@HTML5.CssDefaults]: {width: '50rem'}, // Very wide so it falls off the screen and is 'hidden'
            ![@UI.Importance]    : #Low
        }
    ],
    PresentationVariant #ServiceEmbeddedBreakdownSingleMetricGroupedByDoubleParentLabel: {
        $Type         : 'UI.PresentationVariantType',
        Visualizations: ['@UI.LineItem#ServiceEmbeddedBreakdownGroupedByDoubleParentLabel'],
        SortOrder     : [{Property: name}],
        GroupBy       : [accountStructureItem.toParent.toParent.label]
    },
    LineItem #ServiceEmbeddedBreakdownGroupedByDoubleParentLabel                       : [
        {
            Value                : name,
            ![@HTML5.CssDefaults]: {width: '15rem'}
        },
        {
            Value                : toMetric.metricName,
            ![@HTML5.CssDefaults]: {width: '30rem'}
        },
        {
            Value                : plans,
            ![@HTML5.CssDefaults]: {width: '14rem'}
        },
        {
            Value                : measure_usage,
            ![@HTML5.CssDefaults]: {width: '14rem'}
        },
        {
            Value                : delta_measure_usage,
            ![@HTML5.CssDefaults]: {width: '10rem'}
        },
        {
            Value                : unit,
            ![@HTML5.CssDefaults]: {width: '16rem'}
        },
        {
            Value                : accountStructureItem.toParent.toParent.label,
            Label                : 'Parent',
            ![@HTML5.CssDefaults]: {width: '50rem'}, // Very wide so it falls off the screen and is 'hidden'
            ![@UI.Importance]    : #Low
        }
    ]
});

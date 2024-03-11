using PresentationService as service from '../../srv/presentationService';
using from './charts';

annotate service.CommercialMeasures with @(UI: {
    HeaderInfo                                               : {
        $Type         : 'UI.HeaderInfoType',
        TypeName      : 'Measure',
        TypeNamePlural: 'Measures'
    },
    PresentationVariant #ServiceEmbeddedBreakdown            : {
        $Type         : 'UI.PresentationVariantType',
        Visualizations: ['@UI.LineItem#ServiceEmbeddedBreakdown'],
        GroupBy       : [name],
        SortOrder     : [
            {Property: name},
            {Property: toMetric.metricName}
        ]
    },
    PresentationVariant #ServiceEmbeddedBreakdownSingleMetric: {
        $Type         : 'UI.PresentationVariantType',
        Visualizations: ['@UI.LineItem#ServiceEmbeddedBreakdown'],
        SortOrder     : [{Property: name}]
    },
    LineItem #ServiceEmbeddedBreakdown                       : [
        {
            Value                : name,
            ![@HTML5.CssDefaults]: {width: '14rem'}
        },
        {
            Value                : toMetric.metricName,
            ![@HTML5.CssDefaults]: {width: '19rem'}
        },
        {
            Value                : measure_cost,
            ![@HTML5.CssDefaults]: {width: '11rem'}
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
});

annotate service.TechnicalMeasures with @(UI: {
    HeaderInfo                                               : {
        $Type         : 'UI.HeaderInfoType',
        TypeName      : 'Measure',
        TypeNamePlural: 'Measures'
    },
    PresentationVariant #ServiceEmbeddedBreakdown            : {
        $Type         : 'UI.PresentationVariantType',
        Visualizations: ['@UI.LineItem#ServiceEmbeddedBreakdown'],
        GroupBy       : [name],
        SortOrder     : [
            {Property: name},
            {Property: toMetric.metricName}
        ]
    },
    PresentationVariant #ServiceEmbeddedBreakdownSingleMetric: {
        $Type         : 'UI.PresentationVariantType',
        Visualizations: ['@UI.LineItem#ServiceEmbeddedBreakdown'],
        SortOrder     : [{Property: name}]
    },
    LineItem #ServiceEmbeddedBreakdown                       : [
        {
            Value                : name,
            ![@HTML5.CssDefaults]: {width: '14rem'}
        },
        {
            Value                : toMetric.metricName,
            ![@HTML5.CssDefaults]: {width: '30rem'}
        },
        {
            Value                : measure_usage,
            ![@HTML5.CssDefaults]: {width: '14rem'}
        },
        {
            Value                : unit,
            ![@HTML5.CssDefaults]: {width: '16rem'}
        }
    ],
});

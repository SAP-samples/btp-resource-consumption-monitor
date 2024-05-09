using PresentationService as service from '../../srv/presentationService';
using from './annotations_CMetrics';
using from './annotations_TMetrics';
using from './annotations_Measures';
using from './charts';

// Value Helps
annotate service.BTPServices with @(Capabilities: {FilterRestrictions: {FilterExpressionRestrictions: [{
    Property          : 'retrieved',
    AllowedExpressions: 'SingleRange'
}]}}) {
    serviceName     @(Common: {
        ValueListWithFixedValues: true,
        ValueList               : {
            CollectionPath: 'unique_serviceName',
            Parameters    : [{
                $Type            : 'Common.ValueListParameterOut',
                ValueListProperty: 'serviceName',
                LocalDataProperty: 'serviceName'
            }]
        }
    });
    reportYearMonth @(Common: {
        ValueListWithFixedValues: true,
        ValueList               : {
            CollectionPath: 'unique_reportYearMonth',
            Parameters    : [{
                $Type            : 'Common.ValueListParameterOut',
                ValueListProperty: 'reportYearMonth',
                LocalDataProperty: 'reportYearMonth'
            }]
        }
    });
    interval        @(Common: {
        ValueListWithFixedValues: true,
        ValueList               : {
            CollectionPath: 'unique_interval',
            Parameters    : [{
                $Type            : 'Common.ValueListParameterOut',
                ValueListProperty: 'interval',
                LocalDataProperty: 'interval'
            }]
        },
        FilterDefaultValue      : 'Daily'
    });
};

// List View
annotate service.BTPServices with @(UI: {
    PresentationVariant                        : {
        $Type         : 'UI.PresentationVariantType',
        Visualizations: [@UI.LineItem],
        SortOrder     : [
            {Property: reportYearMonth},
            {
                Property  : cmByGlobalAccount.forecast_cost,
                Descending: true
            }
        ],
    },
    SelectionFields                            : [
        retrieved,
        interval,
        reportYearMonth,
        serviceName
    ],
    LineItem                                   : [
        {
            $Type : 'UI.DataFieldForAction',
            Label : 'Load consumption for current Month',
            Action: 'PresentationService.EntityContainer/proxy_downloadMeasuresForToday'
        },
        {
            $Type : 'UI.DataFieldForAction',
            Label : 'Load historic data',
            Action: 'PresentationService.EntityContainer/proxy_downloadMeasuresForPastMonths'
        },
        {
            $Type : 'UI.DataFieldForAction',
            Label : 'Recalculate Forecasts',
            Action: 'PresentationService.EntityContainer/proxy_calculateCommercialForecasts'
        },
        {
            $Type : 'UI.DataFieldForAction',
            Label : 'Reset all consumption data',
            Action: 'PresentationService.EntityContainer/proxy_deleteAllData'
        },
        {
            $Type : 'UI.DataFieldForAction',
            Label : 'Revert all forecast settings to default',
            Action: 'PresentationService.EntityContainer/proxy_resetForecastSettings'
        },
        {
            Value                : retrieved,
            ![@HTML5.CssDefaults]: {width: '8rem'}
        },
        {
            Value                : reportYearMonth,
            ![@HTML5.CssDefaults]: {width: '5rem'}
        },
        {
            Value                : serviceName,
            ![@HTML5.CssDefaults]: {width: '22rem'}
        },
        {
            Value                : cmByGlobalAccount.measure_cost,
            ![@HTML5.CssDefaults]: {width: '11rem'},
            ![@UI.Hidden]        : hideCommercialInfo
        },
        {
            Value                : cmByGlobalAccount.delta_measure_cost,
            ![@HTML5.CssDefaults]: {width: '11rem'},
            ![@UI.Hidden]        : hideCommercialInfo
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
            ![@HTML5.CssDefaults]    : {width: '6rem'}
        },
        {
            Value                : cmByGlobalAccount.forecast_cost,
            ![@HTML5.CssDefaults]: {width: '11rem'},
            ![@UI.Hidden]        : hideCommercialInfo
        },
        {
            Value                : countCommercialMetrics,
            ![@HTML5.CssDefaults]: {width: '5rem'}
        },
        {
            Value                : countTechnicalMetrics,
            ![@HTML5.CssDefaults]: {width: '5rem'}
        },
    // {
    //     $Type                : 'UI.DataFieldForAction',
    //     Label                : 'DeleteMe',
    //     Action               : 'PresentationService.deleteBTPService',
    //     IconUrl              : 'sap-icon://delete',
    //     // Inline               : true,
    //     InvocationGrouping   : #ChangeSet,
    //     ![@HTML5.CssDefaults]: {width: '4rem'}
    // }
    ],
    PresentationVariant #ServiceEmbeddedHistory: {
        $Type         : 'UI.PresentationVariantType',
        Visualizations: ['@UI.LineItem#ServiceEmbeddedHistory'],
        SortOrder     : [
            {
                Property  : retrieved,
                Descending: true
            },
            {Property: interval}
        ]
    },
    LineItem #ServiceEmbeddedHistory           : [
        {
            Value                : retrieved,
            ![@HTML5.CssDefaults]: {width: '8rem'}
        },
        {
            Value                : reportYearMonth,
            ![@HTML5.CssDefaults]: {width: '5rem'}
        },
        {
            Value                : interval,
            ![@HTML5.CssDefaults]: {width: '8rem'}
        },
        {
            Value                : cmByGlobalAccount.measure_cost,
            ![@HTML5.CssDefaults]: {width: '11rem'},
            ![@UI.Hidden]        : hideCommercialInfo
        },
        {
            Value                : cmByGlobalAccount.delta_measure_cost,
            ![@HTML5.CssDefaults]: {width: '11rem'},
            ![@UI.Hidden]        : hideCommercialInfo
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
            ![@HTML5.CssDefaults]    : {width: '6rem'}
        },
        {
            Value                : cmByGlobalAccount.forecast_cost,
            ![@HTML5.CssDefaults]: {width: '11rem'},
            ![@UI.Hidden]        : hideCommercialInfo
        },
        {
            Value                : countCommercialMetrics,
            ![@HTML5.CssDefaults]: {width: '5rem'}
        },
        {
            Value                : countTechnicalMetrics,
            ![@HTML5.CssDefaults]: {width: '5rem'}
        },
        {
            $Type                : 'UI.DataFieldForAction',
            Label                : 'Delete',
            Action               : 'PresentationService.deleteBTPService',
            IconUrl              : 'sap-icon://delete',
            Inline               : true,
            ![@HTML5.CssDefaults]: {width: '4rem'}
        }
    ],
});

// Object Page
annotate service.BTPServices with @(UI: {
    HeaderInfo               : {
        $Type         : 'UI.HeaderInfoType',
        TypeName      : 'Service',
        TypeNamePlural: 'Services',
        Title         : {Value: serviceName},
        Description   : {Value: 'BTP Service'},
        ImageUrl      : 'sap-icon://money-bills'
    },
    HeaderFacets             : [
        {
            $Type : 'UI.ReferenceFacet',
            Target: '@UI.FieldGroup#Metadata',
            Label : 'Service Details'
        },
        {
            $Type        : 'UI.ReferenceFacet',
            Target       : '@UI.FieldGroup#CostThisMonth',
            Label        : 'Cost For This Month',
            ![@UI.Hidden]: hideCommercialInfo
        },
        {
            $Type        : 'UI.ReferenceFacet',
            Target       : 'cmByGlobalAccount/@UI.Chart#MetricBulletChart',
            ![@UI.Hidden]: hideCommercialInfo
        },
        {
            $Type        : 'UI.ReferenceFacet',
            Target       : '@UI.FieldGroup#DeltaChange',
            Label        : 'Daily Change',
            ![@UI.Hidden]: hideCommercialInfo
        },
        {
            $Type        : 'UI.ReferenceFacet',
            Target       : 'cmByDirectory/@UI.Chart#ComparisonByDirectory',
            ![@UI.Hidden]: hideCommercialInfo
        },
        {
            $Type        : 'UI.ReferenceFacet',
            Target       : 'cmBySubAccount/@UI.Chart#ComparisonBySubAccount',
            ![@UI.Hidden]: hideCommercialInfo
        }
    ],
    Facets                   : [
        {
            $Type : 'UI.CollectionFacet',
            ID    : 'overview',
            Label : 'Overview',
            Facets: [
                {
                    // Needed to trick rendering the below tables with collapsed header (see UI5 v1.121.1)
                    $Type        : 'UI.CollectionFacet',
                    ID           : 'placeholderOverview',
                    Facets       : [],
                    ![@UI.Hidden]: true
                },
                {
                    $Type : 'UI.ReferenceFacet',
                    Label : 'Commercial Metrics',
                    Target: 'commercialMetrics/@UI.PresentationVariant#ServiceEmbeddedMetricsTable'
                },
                {
                    $Type : 'UI.ReferenceFacet',
                    Label : 'Technical Metrics',
                    Target: 'technicalMetrics/@UI.PresentationVariant#ServiceEmbeddedMetricsTable'
                },
                {
                    $Type : 'UI.ReferenceFacet',
                    Label : 'Cost over time (Daily)',
                    Target: 'cmHistoryByMetricDaily/@UI.PresentationVariant#HistoricMeasuresChart'
                },
                {
                    $Type : 'UI.ReferenceFacet',
                    Label : 'Cost over time (Monthly)',
                    Target: 'cmHistoryByMetricMonthly/@UI.PresentationVariant#HistoricMeasuresChart'
                },
                {
                    $Type : 'UI.ReferenceFacet',
                    Label : 'Cost over time (Combined)',
                    Target: 'cmHistoryByMetricAll/@UI.PresentationVariant#HistoricMeasuresAllTimeChart'
                }
            ]
        },
        {
            $Type : 'UI.CollectionFacet',
            ID    : 'commercialInfo',
            Label : 'Commercial Details',
            Facets: [
                {
                    // Needed to trick rendering the below tables with collapsed header (see UI5 v1.121.1)
                    $Type        : 'UI.CollectionFacet',
                    ID           : 'placeholderCommercialInfo',
                    Facets       : [],
                    ![@UI.Hidden]: true
                },
                {
                    $Type : 'UI.ReferenceFacet',
                    Label : 'Breakdown By Directory',
                    Target: 'cmByMetricByDirectory/@UI.PresentationVariant#ServiceEmbeddedBreakdown'
                },
                {
                    $Type : 'UI.ReferenceFacet',
                    Label : 'Breakdown By Sub Account',
                    Target: 'cmByMetricBySubAccount/@UI.PresentationVariant#ServiceEmbeddedBreakdown'
                },
                {
                    $Type : 'UI.ReferenceFacet',
                    Label : 'Breakdown By Datacenter',
                    Target: 'cmByMetricByDatacenter/@UI.PresentationVariant#ServiceEmbeddedBreakdown'
                },
                {
                    $Type : 'UI.ReferenceFacet',
                    Label : 'History',
                    Target: 'commercialMetricsHistory/@UI.PresentationVariant#ServiceEmbeddedHistory'
                }
            ]
        },
        {
            $Type : 'UI.CollectionFacet',
            ID    : 'technicalInfo',
            Label : 'Technical Details',
            Facets: [
                {
                    // Needed to trick rendering the below tables with collapsed header (see UI5 v1.121.1)
                    $Type        : 'UI.CollectionFacet',
                    ID           : 'placeholderTechnicalInfo',
                    Facets       : [],
                    ![@UI.Hidden]: true
                },
                {
                    $Type : 'UI.ReferenceFacet',
                    Label : 'Breakdown By Directory',
                    Target: 'tmByMetricByDirectory/@UI.PresentationVariant#ServiceEmbeddedBreakdown'
                },
                {
                    $Type : 'UI.ReferenceFacet',
                    Label : 'Breakdown By Sub Account',
                    Target: 'tmByMetricBySubAccount/@UI.PresentationVariant#ServiceEmbeddedBreakdown'
                },
                {
                    $Type : 'UI.ReferenceFacet',
                    Label : 'Breakdown By Datacenter',
                    Target: 'tmByMetricByDatacenter/@UI.PresentationVariant#ServiceEmbeddedBreakdown'
                },
                {
                    $Type : 'UI.ReferenceFacet',
                    Label : 'History',
                    Target: 'technicalMetricsHistory/@UI.PresentationVariant#ServiceEmbeddedHistory'
                }
            ]
        },
        {
            $Type : 'UI.ReferenceFacet',
            Target: 'history/@UI.PresentationVariant#ServiceEmbeddedHistory',
            Label : 'History'
        }
    ],
    FieldGroup #Metadata     : {Data: [
        {Value: serviceName},
        {Value: retrieved},
        {Value: countCommercialMetrics},
        {Value: countTechnicalMetrics}
    ]},
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

using PresentationService as service from '../../srv/presentationService';
using from './annotations_CMetrics';
using from './annotations_TMetrics';
using from './annotations_Measures';
using from './charts';
// Plugins
using from '../../srv/_plugin_ai-core';

// Value Helps
annotate service.BTPServices with @(Capabilities: {FilterRestrictions: {FilterExpressionRestrictions: [{
    Property          : 'retrieved',
    AllowedExpressions: 'SingleRange'
}]}}) {
    serviceName     @(Common: {
        ValueListWithFixedValues: true,
        ValueList               : {
            CollectionPath: 'unique_serviceNames',
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
            CollectionPath: 'unique_reportYearMonths',
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
            CollectionPath: 'unique_intervals',
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
                Property  : cmByCustomer.currency,
                Descending: true
            },
            {
                Property  : cmByCustomer.forecast_cost,
                Descending: true
            }
        ]
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
            Label : 'Delete all consumption data',
            Action: 'PresentationService.EntityContainer/proxy_deleteAllData'
        },
        {
            $Type : 'UI.DataFieldForAction',
            Label : 'Delete account structure and all tags',
            Action: 'PresentationService.EntityContainer/proxy_deleteStructureAndTagData'
        },
        {
            $Type : 'UI.DataFieldForAction',
            Label : 'Revert all forecast settings to default',
            Action: 'PresentationService.EntityContainer/proxy_resetForecastSettings'
        },
        {
            $Type : 'UI.DataFieldForAction',
            Label : 'Delete all technical allocations',
            Action: 'PresentationService.EntityContainer/proxy_resetTechnicalAllocations'
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
            Value                : cmByCustomer.measure_cost,
            ![@HTML5.CssDefaults]: {width: '11rem'},
            ![@UI.Hidden]        : hideCommercialInfo
        },
        {
            Value                : cmByCustomer.delta_measure_cost,
            ![@HTML5.CssDefaults]: {width: '11rem'},
            ![@UI.Hidden]        : hideCommercialInfo
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
            ![@HTML5.CssDefaults]    : {width: '6rem'}
        },
        {
            Value                : cmByCustomer.forecast_cost,
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
        }
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
            Value                : cmByCustomer.measure_cost,
            ![@HTML5.CssDefaults]: {width: '11rem'},
            ![@UI.Hidden]        : hideCommercialInfo
        },
        {
            Value                : cmByCustomer.delta_measure_cost,
            ![@HTML5.CssDefaults]: {width: '11rem'},
            ![@UI.Hidden]        : hideCommercialInfo
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
            ![@HTML5.CssDefaults]    : {width: '6rem'}
        },
        {
            Value                : cmByCustomer.forecast_cost,
            ![@HTML5.CssDefaults]: {width: '11rem'},
            ![@UI.Hidden]        : hideCommercialInfo
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
            ![@HTML5.CssDefaults]: {width: '4rem'},
            ![@UI.Importance]    : #High
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
            Target       : 'cmByCustomer/@UI.Chart#MetricBulletChart',
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
            Target       : 'cmByGlobalAccount/@UI.Chart#ComparisonByGlobalAccount',
            ![@UI.Hidden]: {$edmJson: {$Or: [
                {$Path: 'hideCommercialInfo'},
                {$Path: 'hideGlobalAccountDistribution'}
            ]}}
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
                    $Type        : 'UI.ReferenceFacet',
                    Label        : 'Commercial Metrics',
                    Target       : 'commercialMetrics/@UI.PresentationVariant#ServiceEmbeddedMetricsTable',
                    ![@UI.Hidden]: hideCommercialInfo
                },
                {
                    $Type : 'UI.ReferenceFacet',
                    Label : 'Technical Metrics',
                    Target: 'technicalMetrics/@UI.PresentationVariant#ServiceEmbeddedMetricsTable'
                },
                {
                    $Type        : 'UI.ReferenceFacet',
                    Label        : 'Cost over time (Daily)',
                    Target       : 'cmHistoryByMetricDaily/@UI.PresentationVariant#HistoricMeasuresChart',
                    ![@UI.Hidden]: hideCommercialInfo
                },
                {
                    $Type        : 'UI.ReferenceFacet',
                    Label        : 'Cost over time (Monthly)',
                    Target       : 'cmHistoryByMetricMonthly/@UI.PresentationVariant#HistoricMeasuresChart',
                    ![@UI.Hidden]: hideCommercialInfo
                },
                {
                    $Type        : 'UI.ReferenceFacet',
                    Label        : 'Cost over time (Combined)',
                    Target       : 'cmHistoryByMetricAll/@UI.PresentationVariant#HistoricMeasuresAllTimeChart',
                    ![@UI.Hidden]: hideCommercialInfo
                }
            ]
        },
        {
            $Type        : 'UI.CollectionFacet',
            ID           : 'commercialInfo',
            Label        : 'Commercial Details',
            ![@UI.Hidden]: hideCommercialInfo,
            Facets       : [
                {
                    // Needed to trick rendering the below tables with collapsed header (see UI5 v1.121.1)
                    $Type        : 'UI.CollectionFacet',
                    ID           : 'placeholderCommercialInfo',
                    Facets       : [],
                    ![@UI.Hidden]: true
                },
                {
                    $Type        : 'UI.ReferenceFacet',
                    Label        : 'Breakdown By Global Account',
                    Target       : 'cmByMetricByGlobalAccount/@UI.PresentationVariant#ServiceEmbeddedBreakdown',
                    ![@UI.Hidden]: hideGlobalAccountDistribution
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
                    $Type        : 'UI.ReferenceFacet',
                    Label        : 'Breakdown By Instance',
                    Target       : 'cmByMetricByInstance/@UI.PresentationVariant#ServiceEmbeddedBreakdown',
                    ![@UI.Hidden]: hideServiceInstanceDistribution
                },
                {
                    $Type        : 'UI.ReferenceFacet',
                    Label        : 'Breakdown By Application',
                    Target       : 'cmByMetricByApplication/@UI.PresentationVariant#ServiceEmbeddedBreakdown',
                    ![@UI.Hidden]: hideServiceApplicationDistribution
                },
                {
                    $Type        : 'UI.ReferenceFacet',
                    Label        : 'Breakdown By Space',
                    Target       : 'cmByMetricBySpace/@UI.PresentationVariant#ServiceEmbeddedBreakdown',
                    ![@UI.Hidden]: hideCommercialSpaceAllocation
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
                    $Type        : 'UI.ReferenceFacet',
                    Label        : 'Breakdown By Global Account',
                    Target       : 'tmByMetricByGlobalAccount/@UI.PresentationVariant#ServiceEmbeddedBreakdown',
                    ![@UI.Hidden]: hideGlobalAccountDistribution
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
                    $Type        : 'UI.ReferenceFacet',
                    Label        : 'Breakdown By Instance',
                    Target       : 'tmByMetricByInstance/@UI.PresentationVariant#ServiceEmbeddedBreakdown',
                    ![@UI.Hidden]: hideServiceInstanceDistribution
                },
                {
                    $Type        : 'UI.ReferenceFacet',
                    Label        : 'Breakdown By Application',
                    Target       : 'tmByMetricByApplication/@UI.PresentationVariant#ServiceEmbeddedBreakdown',
                    ![@UI.Hidden]: hideServiceApplicationDistribution
                },
                {
                    $Type : 'UI.ReferenceFacet',
                    Label : 'Breakdown By Space',
                    Target: 'tmByMetricBySpace/@UI.PresentationVariant#ServiceEmbeddedBreakdown'
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
        },
        /**
         * Individual pages for dedicated service usage details:
         */
        {
            $Type : 'UI.CollectionFacet',
            ID    : 'plugin_details',
            Label : 'Usage Insights',
            Facets: [
                {
                    // Needed to trick rendering the below tables with collapsed header (see UI5 v1.121.1)
                    $Type        : 'UI.CollectionFacet',
                    ID           : 'plugin_collection',
                    Facets       : [],
                    ![@UI.Hidden]: true
                },
                {
                    $Type        : 'UI.ReferenceFacet',
                    Target       : 'plugin_aicore/@UI.PresentationVariant#Table',
                    ID           : 'plugin_aicore_table',
                    Label        : 'Models',
                    ![@UI.Hidden]: (serviceId != 'ai-core')
                },
                {
                    $Type        : 'UI.ReferenceFacet',
                    Target       : 'plugin_aicore/@UI.PresentationVariant#Chart',
                    ID           : 'plugin_aicore_chart',
                    Label        : 'Chart',
                    ![@UI.Hidden]: (serviceId != 'ai-core')
                }
            ]
        }
    ],
    FieldGroup #Metadata     : {Data: [
        {Value: serviceId},
        {Value: retrieved},
        {Value: countCommercialMetrics},
        {Value: countTechnicalMetrics}
    ]},
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

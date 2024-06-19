using ManageAlertsService as service from '../../srv/manageAlertsService';

annotate service.Alerts with @(Common.SideEffects #runSimulation: {
    SourceProperties: [
        alertType,
        levelScope,
        levelMode,
        serviceScope,
        serviceMode
    ],
    SourceEntities  : [
        levelItems,
        serviceItems,
        thresholds
    ],
    TargetProperties: [
        'simulation_table',
        'simulation_json'
    ]
});

// Code lists
annotate service.Alerts with {
    levelScope   @(Common: {
        ValueListWithFixedValues: true,
        ValueList               : {
            CollectionPath: 'CL_AggregationLevels',
            Parameters    : [
                {
                    $Type            : 'Common.ValueListParameterOut',
                    ValueListProperty: 'code',
                    LocalDataProperty: 'levelScope'
                },
                {
                    $Type            : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty: 'description'
                }
            ]
        }
    });
    serviceScope @(Common: {
        ValueListWithFixedValues: true,
        ValueList               : {
            CollectionPath: 'CL_ServiceScopes',
            Parameters    : [
                {
                    $Type            : 'Common.ValueListParameterIn',
                    ValueListProperty: 'context',
                    LocalDataProperty: 'alertType'
                },
                {
                    $Type            : 'Common.ValueListParameterOut',
                    ValueListProperty: 'code',
                    LocalDataProperty: 'serviceScope'
                },
                {
                    $Type            : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty: 'description'
                }
            ]
        }
    });
    alertType    @(Common: {
        ValueListWithFixedValues: true,
        ValueList               : {
            CollectionPath: 'CL_AlertTypes',
            Parameters    : [
                {
                    $Type            : 'Common.ValueListParameterOut',
                    ValueListProperty: 'code',
                    LocalDataProperty: 'alertType'
                },
                {
                    $Type            : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty: 'description'
                }
            ]
        }
    });

    levelMode    @(Common: {
        ValueListWithFixedValues: true,
        // ValueListWithFixedValues.@Common.ValueListShowValuesImmediately:true, // Do not use - does not trigger Side Effects for now
        ValueList               : {
            CollectionPath: 'CL_AlertIncludeModes',
            Parameters    : [
                {
                    $Type            : 'Common.ValueListParameterOut',
                    ValueListProperty: 'code',
                    LocalDataProperty: 'levelMode'
                },
                {
                    $Type            : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty: 'description'
                }
            ]
        }
    });
    serviceMode  @(Common: {
        ValueListWithFixedValues: true,
        // ValueListWithFixedValues.@Common.ValueListShowValuesImmediately:true, // Do not use - does not trigger Side Effects for now
        ValueList               : {
            CollectionPath: 'CL_AlertIncludeModes',
            Parameters    : [
                {
                    $Type            : 'Common.ValueListParameterOut',
                    ValueListProperty: 'code',
                    LocalDataProperty: 'serviceMode'
                },
                {
                    $Type            : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty: 'description'
                }
            ]
        }
    });
}

annotate service.AlertServiceItems with {
    itemID @(
        title : 'Filter Items',
        Common: {
            ValueListWithFixedValues: true,
            ValueList               : {
                CollectionPath: 'ServiceAndMetricNames',
                Parameters    : [
                    {
                        $Type            : 'Common.ValueListParameterIn',
                        LocalDataProperty: toAlert.serviceScope,
                        ValueListProperty: 'level'
                    },
                    {
                        $Type            : 'Common.ValueListParameterDisplayOnly',
                        ValueListProperty: 'name'
                    },
                    {
                        $Type            : 'Common.ValueListParameterInOut',
                        LocalDataProperty: itemID,
                        ValueListProperty: 'id'
                    }
                ]
            }
        }
    )
}

annotate service.AlertLevelItems with {
    itemID @(
        title : 'Filter Items',
        Common: {
            ValueListWithFixedValues: true,
            ValueList               : {
                CollectionPath: 'LevelNames',
                Parameters    : [
                    {
                        $Type            : 'Common.ValueListParameterIn',
                        LocalDataProperty: toAlert.levelScope,
                        ValueListProperty: 'level'
                    },
                    {
                        $Type            : 'Common.ValueListParameterDisplayOnly',
                        ValueListProperty: 'name'
                    },
                    {
                        $Type            : 'Common.ValueListParameterInOut',
                        LocalDataProperty: itemID,
                        ValueListProperty: 'id'
                    }
                ]
            }
        }
    )
}

annotate service.AlertThresholds with {
    property @(Common: {
        ValueListWithFixedValues: true,
        ValueList               : {
            CollectionPath: 'CL_ThresholdProperties',
            Parameters    : [
                {
                    $Type            : 'Common.ValueListParameterOut',
                    ValueListProperty: 'code',
                    LocalDataProperty: 'property'
                },
                {
                    $Type            : 'Common.ValueListParameterIn',
                    ValueListProperty: 'context',
                    LocalDataProperty: toAlert.alertType
                },
                {
                    $Type            : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty: 'description'
                }
            ]
        }
    });
    operator @(Common: {
        ValueListWithFixedValues: true,
        ValueList               : {
            CollectionPath: 'CL_ThresholdOperators',
            Parameters    : [
                {
                    $Type            : 'Common.ValueListParameterOut',
                    ValueListProperty: 'code',
                    LocalDataProperty: 'operator'
                },
                {
                    $Type            : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty: 'description'
                }
            ]
        }
    });
}

// List view
annotate service.Alerts with @(UI: {
    PresentationVariant: {
        $Type         : 'UI.PresentationVariantType',
        Visualizations: [@UI.LineItem],
        SortOrder     : [{Property: name}],
        GroupBy       : [levelScope]
    },
    SelectionFields    : [
        active,
        alertType,
        levelScope
    ],
    LineItem           : [
        {
            Value                    : active,
            Criticality              : activeCriticality,
            CriticalityRepresentation: #WithIcon,
            ![@HTML5.CssDefaults]    : {width: '6rem'}
        },
        {
            Value                : name,
            ![@HTML5.CssDefaults]: {width: '14rem'}
        },
        {
            Value                : alertType,
            ![@HTML5.CssDefaults]: {width: '10rem'}
        },
        {
            Value                : levelScope,
            ![@HTML5.CssDefaults]: {width: '10rem'}
        },
        {
            Value                : serviceScope,
            ![@HTML5.CssDefaults]: {width: '10rem'}
        },
        {
            Value                : thresholds.text,
            Label                : 'Defined Thresholds',
            ![@HTML5.CssDefaults]: {width: '30rem'}
        }
    ]
});

// Object Page
annotate service.Alerts with @(UI: {
    HeaderInfo          : {
        $Type         : 'UI.HeaderInfoType',
        TypeName      : 'Alert',
        TypeNamePlural: 'Alerts',
        Title         : {Value: name},
        Description   : {Value: 'Alert'},
        ImageUrl      : 'sap-icon://bell'
    },
    HeaderFacets        : [{
        $Type : 'UI.ReferenceFacet',
        Target: '@UI.FieldGroup#Metadata',
        Label : 'Alert Details'
    }],
    Facets              : [
        {
            $Type : 'UI.ReferenceFacet',
            Target: '@UI.FieldGroup#General',
            Label : 'General',
        },
        {
            $Type : 'UI.CollectionFacet',
            Label : 'Scope',
            Facets: [
                {
                    $Type : 'UI.ReferenceFacet',
                    Target: '@UI.FieldGroup#Level',
                    Label : 'Account Structure'
                },
                {
                    $Type : 'UI.ReferenceFacet',
                    Target: '@UI.FieldGroup#Service',
                    Label : 'Service Scope'
                }
            ]
        },
        {
            $Type : 'UI.ReferenceFacet',
            Label : 'Thresholds',
            Target: 'thresholds/@UI.PresentationVariant',
        }
    ],
    FieldGroup #Metadata: {
        $Type: 'UI.FieldGroupType',
        Data : [
            {Value: modifiedAt},
            {Value: modifiedBy}
        ],
    },
    FieldGroup #General : {
        $Type: 'UI.FieldGroupType',
        Data : [
            {Value: name},
            {Value: alertType},
            {
                Value                    : active,
                Criticality              : activeCriticality,
                CriticalityRepresentation: #WithIcon
            },
        ]
    },
    FieldGroup #Level   : {
        $Type: 'UI.FieldGroupType',
        Data : [
            {Value: levelScope},
            {Value: levelMode},
            {Value: levelItems.itemID}
        ]
    },
    FieldGroup #Service : {
        $Type: 'UI.FieldGroupType',
        Data : [
            {Value: serviceScope},
            {Value: serviceMode},
            {Value: serviceItems.itemID}
        ]
    }
});

annotate service.AlertThresholds with @(UI: {
    PresentationVariant: {
        $Type         : 'UI.PresentationVariantType',
        Visualizations: [@UI.LineItem],
        SortOrder     : [{Property: property}]
    },
    LineItem           : [
        {
            Value                : property,
            ![@HTML5.CssDefaults]: {width: '16rem'}
        },
        {
            Value                : operator,
            ![@HTML5.CssDefaults]: {width: '5rem'}
        },
        {
            Value                : amount,
            ![@HTML5.CssDefaults]: {width: '10rem'}
        }
    ],
    HeaderInfo         : {
        $Type         : 'UI.HeaderInfoType',
        TypeName      : 'Threshold',
        TypeNamePlural: 'Thresholds'
    }
});

using ManageAlertsService as service from '../../srv/manageAlertsService';

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
    levelItems   @(Common: {
        ValueListWithFixedValues: false,
        ValueList               : {
            CollectionPath: 'LevelNames',
            Parameters    : [{
                $Type            : 'Common.ValueListParameterOut',
                ValueListProperty: 'name',
                LocalDataProperty: 'levelItems'
            }]
        }
    })

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
        levelScope,
        serviceScope
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
            ![@HTML5.CssDefaults]: {width: '24rem'}
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
    Identification      : [{
        $Type : 'UI.DataFieldForAction',
        Action: 'ManageAlertsService.testAlert',
        Label : 'Test Alert ...'
    }],
    Facets              : [
        {
            $Type : 'UI.ReferenceFacet',
            Target: '@UI.FieldGroup#General',
            Label : 'General',
        },
        {
            $Type : 'UI.ReferenceFacet',
            Target: '@UI.FieldGroup#Level',
            Label : 'Hierarchy'
        },
        {
            $Type : 'UI.ReferenceFacet',
            Target: '@UI.FieldGroup#Service',
            Label : 'Level of detail'
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
            {Value: levelItemsText},
            {
                $Type : 'UI.DataFieldForAction',
                Label : 'Set Items',
                Action: 'ManageAlertsService.setLevelItems'
            },
        ]
    },
    FieldGroup #Service : {
        $Type: 'UI.FieldGroupType',
        Data : [
            {Value: serviceScope},
            {Value: serviceMode},
            {Value: serviceItemsText},
            {
                $Type : 'UI.DataFieldForAction',
                Label : 'Set Items',
                Action: 'ManageAlertsService.setServiceItems'
            },
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

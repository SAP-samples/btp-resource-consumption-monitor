using ManageTagsService as service from '../../srv/manageTagsService';

annotate service.AccountStructureItems with {
    lifecycle @(Common: {
        ValueListWithFixedValues: true,
        ValueList               : {
            CollectionPath: 'CL_TagsLifecycles',
            Parameters    : [{
                $Type            : 'Common.ValueListParameterInOut',
                ValueListProperty: 'code',
                LocalDataProperty: 'lifecycle'
            }]
        }
    });
};

// annotate service.CL_PasteTagModes with @(UI: {
//     PresentationVariant #sorted: {
//         $Type         : 'UI.PresentationVariantType',
//         Visualizations: [@UI.LineItem],
//         SortOrder     : [{Property: code}]
//     },
//     LineItem                   : [{Value: description}]
// });

annotate types.TPasteTagsParams with {
    mode @(Common: {
        Label                   : 'Select type of tags',
        ValueListWithFixedValues: true,
        ValueList               : {
            // PresentationVariantQualifier: '#sorted',
            CollectionPath: 'CL_PasteTagModes',
            Parameters    : [{
                $Type            : 'Common.ValueListParameterOut',
                ValueListProperty: 'description',
                LocalDataProperty: 'mode'
            }]
        }
    });
};

annotate service.AccountStructureItems with {
    ID         @sap.hierarchy.node.for;
    parentID   @sap.hierarchy.parent.node.for;
    treeLevel  @sap.hierarchy.level.for        @UI.Hidden;
    treeState  @sap.hierarchy.drill.state.for  @UI.Hidden;
};

annotate service.AccountStructureItems with @(UI: {
    PresentationVariant: {
        $Type                : 'UI.PresentationVariantType',
        Visualizations       : ['@UI.LineItem'],
        InitialExpansionLevel: 3,
        RequestAtLeast       : [
            icon,
            managedTagAllocations.name,
            managedTagAllocations.value,
            managedTagAllocations.pct,
            customTags.name,
            customTags.value
        ]
    },
    // SelectionFields    : [
    //     environment,
    //     level,
    //     excluded
    // ],
    HeaderInfo         : {
        $Type         : 'UI.HeaderInfoType',
        TypeName      : 'Account Structure',
        TypeNamePlural: 'Account Structures',
        Title         : {Value: name},
        Description   : {Value: level},
        ImageUrl      : 'sap-icon://org-chart'
    },
    HeaderFacets       : [{
        $Type : 'UI.ReferenceFacet',
        Target: '@UI.FieldGroup#Header'
    }],
    LineItem           : [
        {
            $Type : 'UI.DataFieldForAction',
            Inline: false,
            Label : 'Paste',
            Action: 'ManageTagsService.EntityContainer/AccountStructureItems_pasteTags'
        },
        {
            $Type : 'UI.DataFieldForAction',
            Inline: false,
            Label : 'Delete',
            Action: 'ManageTagsService.EntityContainer/AccountStructureItems_deleteTags'
        },
        {
            Value                : tagTextManaged0,
            ![@HTML5.CssDefaults]: {width: '17rem'},
            ![@UI.Hidden]        : false
        },
        {
            $Type                : 'UI.DataFieldForAction',
            Label                : 'Copy Tags',
            Inline               : true,
            IconUrl              : 'sap-icon://copy',
            Action               : 'ManageTagsService.EntityContainer/AccountStructureItems_copyTags',
            ![@HTML5.CssDefaults]: {width: '4rem'}
        },
        {
            Value                : tagTextManaged1,
            ![@HTML5.CssDefaults]: {width: '13rem'},
            ![@UI.Hidden]        : false
        },
        {
            Value                : tagTextManaged2,
            ![@HTML5.CssDefaults]: {width: '13rem'},
            ![@UI.Hidden]        : true
        },
        {
            Value                : tagTextManaged3,
            ![@HTML5.CssDefaults]: {width: '13rem'},
            ![@UI.Hidden]        : true
        },
        {
            Value                : tagTextManaged4,
            ![@HTML5.CssDefaults]: {width: '13rem'},
            ![@UI.Hidden]        : true
        },
        {
            Value                : tagTextManaged5,
            ![@HTML5.CssDefaults]: {width: '13rem'},
            ![@UI.Hidden]        : true
        },
        {
            Value                : tagTextManaged6,
            ![@HTML5.CssDefaults]: {width: '13rem'},
            ![@UI.Hidden]        : true
        },
        {
            Value                : tagTextManaged7,
            ![@HTML5.CssDefaults]: {width: '13rem'},
            ![@UI.Hidden]        : true
        },
        {
            Value                : tagTextManaged8,
            ![@HTML5.CssDefaults]: {width: '13rem'},
            ![@UI.Hidden]        : true
        },
        {
            Value                : tagTextManaged9,
            ![@HTML5.CssDefaults]: {width: '13rem'},
            ![@UI.Hidden]        : true
        },
        {
            Value                : tagTextCustomTags,
            ![@HTML5.CssDefaults]: {width: '15rem'}
        },
        {
            Value                : excluded,
            ![@HTML5.CssDefaults]: {width: '8rem'},
            Label                : 'Exclude'
        },
        {
            Value                : lifecycle,
            ![@HTML5.CssDefaults]: {width: '8rem'},
            Label                : 'Lifecycle'
        },
        {
            Value                : region,
            ![@HTML5.CssDefaults]: {width: '10rem'}
        },
        {
            Value                : environment,
            ![@HTML5.CssDefaults]: {width: '5rem'}
        }
    ],
    Facets             : [
        {
            $Type : 'UI.ReferenceFacet',
            Label : 'Information',
            Target: '@UI.FieldGroup#Info'
        },
        {
            $Type : 'UI.ReferenceFacet',
            Label : 'Managed Tags',
            ID    : 'managedTagAllocations',
            Target: 'managedTagAllocations/@UI.LineItem'
        },
        {
            $Type : 'UI.ReferenceFacet',
            Label : 'Custom Tags',
            ID    : 'customTags',
            Target: 'customTags/@UI.LineItem'
        }
    ],
    FieldGroup #Header : {
        $Type: 'UI.FieldGroupType',
        Data : [
            {Value: ID},
            {Value: region},
            {Value: environment},
        ]
    },
    FieldGroup #Info   : {
        $Type: 'UI.FieldGroupType',
        Data : [
            {Value: lifecycle},
            {Value: excluded},
        ]
    }
});

annotate service.ManagedTagAllocations with @(UI: {
    PresentationVariant: {
        $Type         : 'UI.PresentationVariantType',
        Visualizations: ['@UI.LineItem'],
        // GroupBy       : [name],
        SortOrder     : [{Property: value}]
    },
    LineItem           : [
        {
            Value                : name,
            ![@HTML5.CssDefaults]: {width: '10rem'},
        },
        {
            Value                : value,
            ![@HTML5.CssDefaults]: {width: '10rem'},
        },
        {
            Value                : pct,
            ![@HTML5.CssDefaults]: {width: '5rem'},
        }
    ]
}) {
    name @(Common: {
        ValueListWithFixedValues: true,
        ValueList               : {
            CollectionPath: 'CL_ManagedTagNames',
            Parameters    : [{
                $Type            : 'Common.ValueListParameterInOut',
                ValueListProperty: 'code',
                LocalDataProperty: 'name'
            }]
        }
    });
};

annotate service.CustomTags with @(UI: {
    PresentationVariant: {
        $Type         : 'UI.PresentationVariantType',
        Visualizations: ['@UI.LineItem'],
        SortOrder     : [{Property: name}]
    },
    LineItem           : [
        {
            Value                : name,
            ![@HTML5.CssDefaults]: {width: '12rem'},
        },
        {
            Value                : value,
            ![@HTML5.CssDefaults]: {width: '13rem'},
        }
    ]
});

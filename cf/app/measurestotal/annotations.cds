using AnalyticsService as service from '../../srv/analyticsService';

annotate service.unique_years with @(UI: {
    PresentationVariant: {
        $Type         : 'UI.PresentationVariantType',
        Visualizations: [@UI.LineItem],
        SortOrder     : [{
            Property  : year,
            Descending: true
        }]
    },
    LineItem           : [{Value: year}],
});

annotate service.CommercialMeasures with @(Capabilities: {FilterRestrictions: {
    $Type             : 'Capabilities.FilterRestrictionsType',
    RequiredProperties: [
        interval,
        retrieved
    ]
}}) {
    retrieved                                @(sap.filter.restriction: 'single-value');
    interval                                 @(
        sap.filter.restriction: 'single-value',
        Common                : {
            ValueListWithFixedValues: true,
            ValueList               : {
                CollectionPath: 'unique_intervals',
                Parameters    : [{
                    $Type            : 'Common.ValueListParameterOut',
                    ValueListProperty: 'interval',
                    LocalDataProperty: 'interval'
                }]
            }
        }
    );
    AccountStructureItem_ID                  @sap.hierarchy.node.for;
    AccountStructureItem_parentID            @sap.hierarchy.parent.node.for;
    AccountStructureItem_treeLevel           @sap.hierarchy.level.for        @UI.Hidden;
    AccountStructureItem_treeState           @sap.hierarchy.drill.state.for  @UI.Hidden;
    reportYear                               @title: 'Year';
    Measures_countServices                   @title: '#';
    Measures_serviceNames                    @title: 'Services';
    Measures_measure_cost                    @title: 'Cost';
    Measures_measure_usage                   @title: 'Usage';
    Measures_measure_actualUsage             @title: 'Actual Usage';
    Measures_measure_chargedBlocks           @title: 'Charged Blocks';
    Measures_forecast_cost                   @title: 'Forecasted Cost';
    Measures_forecast_usage                  @title: 'Forecasted Usage';
    Measures_forecast_actualUsage            @title: 'Forecasted Actual Usage';
    Measures_forecast_chargedBlocks          @title: 'Forecasted Charged Blocks';
    Measures_delta_measure_cost              @title: 'Delta Cost';
    Measures_delta_measure_usage             @title: 'Delta Usage';
    Measures_delta_measure_actualUsage       @title: 'Delta Actual Usage';
    Measures_delta_measure_chargedBlocks     @title: 'Delta Charged Blocks';
    Measures_delta_measure_costPct           @title: 'Delta Cost %';
    Measures_delta_measure_usagePct          @title: 'Delta Usage %';
    Measures_delta_measure_actualUsagePct    @title: 'Delta Actual Usage %';
    Measures_delta_measure_chargedBlocksPct  @title: 'Delta Charged Blocks %';
    Measures_delta_forecast_cost             @title: 'Delta Forecasted Cost';
    Measures_delta_forecast_usage            @title: 'Delta Forecasted Usage';
    Measures_delta_forecast_actualUsage      @title: 'Delta Forecasted Actual Usage';
    Measures_delta_forecast_chargedBlocks    @title: 'Delta Forecasted Charged Blocks';
    Measures_delta_forecast_costPct          @title: 'Delta Forecasted Cost %';
    Measures_delta_forecast_usagePct         @title: 'Delta Forecasted Usage %';
    Measures_delta_forecast_actualUsagePct   @title: 'Delta Forecasted Actual Usage %';
    Measures_delta_forecast_chargedBlocksPct @title: 'Delta Forecasted Charged Blocks %';
};

annotate service.CommercialMeasures with @(UI: {
    PresentationVariant: {
        $Type                : 'UI.PresentationVariantType',
        Visualizations       : [@UI.LineItem],
        InitialExpansionLevel: 3,
        RequestAtLeast       : [
            Measures_serviceNames,
            AccountStructureItem_icon
        ] // for the column extension
    },
    SelectionFields    : [
        interval,
        retrieved
    ],
    LineItem           : [
        // {
        //     Value                : AccountStructureItem_label,
        //     ![@HTML5.CssDefaults]: {width: '25rem'}
        // },
        {
            Value                : AccountStructureItem_excluded,
            ![@HTML5.CssDefaults]: {width: '5rem'}
        },
        {
            Value                : AccountStructureItem_lifecycle,
            ![@HTML5.CssDefaults]: {width: '8rem'}
        },
        {
            Value                : retrieved,
            ![@HTML5.CssDefaults]: {width: '10rem'}
        },
        {
            Value                : Measures_measure_cost,
            ![@HTML5.CssDefaults]: {width: '9rem'}
        },
        {
            Value                : Measures_delta_measure_cost,
            ![@HTML5.CssDefaults]: {width: '9rem'}
        },
        {
            Value                : Measures_delta_measure_costPct,
            ![@HTML5.CssDefaults]: {width: '7rem'}
        },
        {
            Value                : Measures_forecast_cost,
            ![@HTML5.CssDefaults]: {width: '9rem'}
        },
        {
            Value                : Measures_delta_forecast_cost,
            ![@HTML5.CssDefaults]: {width: '9rem'}
        },
        {
            Value                : Measures_delta_forecast_costPct,
            ![@HTML5.CssDefaults]: {width: '7rem'}
        }
    ]
});

annotate service.CommercialMeasuresByTags with @(Capabilities: {FilterRestrictions: {
    $Type             : 'Capabilities.FilterRestrictionsType',
    RequiredProperties: [
        interval,
        retrieved,
        Tag_name,
        Tag_value
    ]
}}) {
    Tag_name                                 @(
        sap.filter.restriction: 'single-value',
        Common                : {
            ValueListWithFixedValues: true,
            ValueList               : {
                CollectionPath: 'unique_tagNames',
                Parameters    : [{
                    $Type            : 'Common.ValueListParameterOut',
                    ValueListProperty: 'tag_name',
                    LocalDataProperty: 'Tag_name'
                }]
            }
        }
    );
    Tag_value                                @(
        sap.filter.restriction: 'single-value',
        Common                : {
            ValueListWithFixedValues: true,
            ValueList               : {
                CollectionPath: 'unique_tagValues',
                Parameters    : [{
                    $Type            : 'Common.ValueListParameterOut',
                    ValueListProperty: 'tag_value',
                    LocalDataProperty: 'Tag_value'
                }]
            }
        }
    );
    Tag_name                                 @title: 'Tag Name';
    Tag_value                                @title: 'Tag Value';
    Tag_label                                @title: 'Tag Allocation';
    Measures_measure_cost                    @title: 'Cost';
    Measures_measure_usage                   @title: 'Usage';
    Measures_measure_actualUsage             @title: 'Actual Usage';
    Measures_measure_chargedBlocks           @title: 'Charged Blocks';
    Measures_forecast_cost                   @title: 'Forecasted Cost';
    Measures_forecast_usage                  @title: 'Forecasted Usage';
    Measures_forecast_actualUsage            @title: 'Forecasted Actual Usage';
    Measures_forecast_chargedBlocks          @title: 'Forecasted Charged Blocks';
    Measures_delta_measure_cost              @title: 'Delta Cost';
    Measures_delta_measure_usage             @title: 'Delta Usage';
    Measures_delta_measure_actualUsage       @title: 'Delta Actual Usage';
    Measures_delta_measure_chargedBlocks     @title: 'Delta Charged Blocks';
    Measures_delta_measure_costPct           @title: 'Delta Cost %';
    Measures_delta_measure_usagePct          @title: 'Delta Usage %';
    Measures_delta_measure_actualUsagePct    @title: 'Delta Actual Usage %';
    Measures_delta_measure_chargedBlocksPct  @title: 'Delta Charged Blocks %';
    Measures_delta_forecast_cost             @title: 'Delta Forecasted Cost';
    Measures_delta_forecast_usage            @title: 'Delta Forecasted Usage';
    Measures_delta_forecast_actualUsage      @title: 'Delta Forecasted Actual Usage';
    Measures_delta_forecast_chargedBlocks    @title: 'Delta Forecasted Charged Blocks';
    Measures_delta_forecast_costPct          @title: 'Delta Forecasted Cost %';
    Measures_delta_forecast_usagePct         @title: 'Delta Forecasted Usage %';
    Measures_delta_forecast_actualUsagePct   @title: 'Delta Forecasted Actual Usage %';
    Measures_delta_forecast_chargedBlocksPct @title: 'Delta Forecasted Charged Blocks %';
};

annotate service.CommercialMeasuresByTags with @(UI: {
    SelectionPresentationVariant #NoInheritance: {
        $Type              : 'UI.SelectionPresentationVariantType',
        Text               : 'Hide Tag Inheritance',
        PresentationVariant: {
            $Type                : 'UI.PresentationVariantType',
            Visualizations       : [@UI.LineItem],
            InitialExpansionLevel: 3
        }
    },
    PresentationVariant                        : {
        $Type                : 'UI.PresentationVariantType',
        Visualizations       : [@UI.LineItem],
        InitialExpansionLevel: 3
    },
    SelectionFields                            : [
        interval,
        retrieved,
        Tag_name,
        Tag_value
    ],
    LineItem                                   : [
        // {
        //     Value                : AccountStructureItem_label,
        //     ![@HTML5.CssDefaults]: {width: '25rem'}
        // },
        {
            Value                : retrieved,
            ![@HTML5.CssDefaults]: {width: '10rem'}
        },
        {
            Value                : Tag_label,
            ![@HTML5.CssDefaults]: {width: '10rem'}
        },
        {
            Value                : Measures_measure_cost,
            ![@HTML5.CssDefaults]: {width: '9rem'}
        },
        {
            Value                : Measures_delta_measure_cost,
            ![@HTML5.CssDefaults]: {width: '9rem'}
        },
        {
            Value                : Measures_delta_measure_costPct,
            ![@HTML5.CssDefaults]: {width: '7rem'}
        },
        {
            Value                : Measures_forecast_cost,
            ![@HTML5.CssDefaults]: {width: '9rem'}
        },
        {
            Value                : Measures_delta_forecast_cost,
            ![@HTML5.CssDefaults]: {width: '9rem'}
        },
        {
            Value                : Measures_delta_forecast_costPct,
            ![@HTML5.CssDefaults]: {width: '7rem'}
        }
    ]
});

annotate service.CommercialMeasuresByTagsWInheritances with @(Capabilities: {FilterRestrictions: {
    $Type             : 'Capabilities.FilterRestrictionsType',
    RequiredProperties: [
        interval,
        retrieved,
        Tag_name,
        Tag_value
    ]
}}) {
    Tag_name                                 @(
        sap.filter.restriction: 'single-value',
        Common                : {
            ValueListWithFixedValues: true,
            ValueList               : {
                CollectionPath: 'unique_tagNames',
                Parameters    : [{
                    $Type            : 'Common.ValueListParameterOut',
                    ValueListProperty: 'tag_name',
                    LocalDataProperty: 'Tag_name'
                }]
            }
        }
    );
    Tag_value                                @(
        sap.filter.restriction: 'single-value',
        Common                : {
            ValueListWithFixedValues: true,
            ValueList               : {
                CollectionPath: 'unique_tagValues',
                Parameters    : [{
                    $Type            : 'Common.ValueListParameterOut',
                    ValueListProperty: 'tag_value',
                    LocalDataProperty: 'Tag_value'
                }]
            }
        }
    );
    Tag_name                                 @title: 'Tag Name';
    Tag_value                                @title: 'Tag Value';
    Tag_label                                @title: 'Tag Allocation';
    Measures_measure_cost                    @title: 'Cost';
    Measures_measure_usage                   @title: 'Usage';
    Measures_measure_actualUsage             @title: 'Actual Usage';
    Measures_measure_chargedBlocks           @title: 'Charged Blocks';
    Measures_forecast_cost                   @title: 'Forecasted Cost';
    Measures_forecast_usage                  @title: 'Forecasted Usage';
    Measures_forecast_actualUsage            @title: 'Forecasted Actual Usage';
    Measures_forecast_chargedBlocks          @title: 'Forecasted Charged Blocks';
    Measures_delta_measure_cost              @title: 'Delta Cost';
    Measures_delta_measure_usage             @title: 'Delta Usage';
    Measures_delta_measure_actualUsage       @title: 'Delta Actual Usage';
    Measures_delta_measure_chargedBlocks     @title: 'Delta Charged Blocks';
    Measures_delta_measure_costPct           @title: 'Delta Cost %';
    Measures_delta_measure_usagePct          @title: 'Delta Usage %';
    Measures_delta_measure_actualUsagePct    @title: 'Delta Actual Usage %';
    Measures_delta_measure_chargedBlocksPct  @title: 'Delta Charged Blocks %';
    Measures_delta_forecast_cost             @title: 'Delta Forecasted Cost';
    Measures_delta_forecast_usage            @title: 'Delta Forecasted Usage';
    Measures_delta_forecast_actualUsage      @title: 'Delta Forecasted Actual Usage';
    Measures_delta_forecast_chargedBlocks    @title: 'Delta Forecasted Charged Blocks';
    Measures_delta_forecast_costPct          @title: 'Delta Forecasted Cost %';
    Measures_delta_forecast_usagePct         @title: 'Delta Forecasted Usage %';
    Measures_delta_forecast_actualUsagePct   @title: 'Delta Forecasted Actual Usage %';
    Measures_delta_forecast_chargedBlocksPct @title: 'Delta Forecasted Charged Blocks %';
};

annotate service.CommercialMeasuresByTagsWInheritances with @(UI: {
    SelectionPresentationVariant #WithInheritance: {
        $Type              : 'UI.SelectionPresentationVariantType',
        Text               : 'Show Tag Inheritance',
        PresentationVariant: {
            $Type                : 'UI.PresentationVariantType',
            Visualizations       : [@UI.LineItem],
            InitialExpansionLevel: 3
        }
    },
    PresentationVariant                          : {
        $Type                : 'UI.PresentationVariantType',
        Visualizations       : [@UI.LineItem],
        InitialExpansionLevel: 3
    },
    SelectionFields                              : [
        interval,
        retrieved,
        Tag_name,
        Tag_value
    ],
    LineItem                                     : [
        // {
        //     Value                : AccountStructureItem_label,
        //     ![@HTML5.CssDefaults]: {width: '25rem'}
        // },
        {
            Value                : retrieved,
            ![@HTML5.CssDefaults]: {width: '10rem'}
        },
        {
            Value                : Tag_label,
            ![@HTML5.CssDefaults]: {width: '10rem'}
        },
        {
            Value                : Measures_measure_cost,
            ![@HTML5.CssDefaults]: {width: '9rem'}
        },
        {
            Value                : Measures_delta_measure_cost,
            ![@HTML5.CssDefaults]: {width: '9rem'}
        },
        {
            Value                : Measures_delta_measure_costPct,
            ![@HTML5.CssDefaults]: {width: '7rem'}
        },
        {
            Value                : Measures_forecast_cost,
            ![@HTML5.CssDefaults]: {width: '9rem'}
        },
        {
            Value                : Measures_delta_forecast_cost,
            ![@HTML5.CssDefaults]: {width: '9rem'}
        },
        {
            Value                : Measures_delta_forecast_costPct,
            ![@HTML5.CssDefaults]: {width: '7rem'}
        }
    ]
});

annotate service.CommercialMeasuresForYears with @(Capabilities: {FilterRestrictions: {
    $Type             : 'Capabilities.FilterRestrictionsType',
    RequiredProperties: [reportYear]
}}) {
    reportYear                        @(
        sap.filter.restriction: 'single-value',
        Common                : {
            ValueListWithFixedValues: true,
            ValueList               : {
                CollectionPath: 'unique_years',
                Parameters    : [{
                    $Type            : 'Common.ValueListParameterOut',
                    ValueListProperty: 'year',
                    LocalDataProperty: 'reportYear'
                }]
            }
        }
    );
    Measures_measure_cost_01          @title: 'January';
    Measures_measure_cost_02          @title: 'February';
    Measures_measure_cost_03          @title: 'March';
    Measures_measure_cost_04          @title: 'April';
    Measures_measure_cost_05          @title: 'May';
    Measures_measure_cost_06          @title: 'June';
    Measures_measure_cost_07          @title: 'July';
    Measures_measure_cost_08          @title: 'August';
    Measures_measure_cost_09          @title: 'September';
    Measures_measure_cost_10          @title: 'October';
    Measures_measure_cost_11          @title: 'November';
    Measures_measure_cost_12          @title: 'December';
    Measures_delta_measure_cost_01    @title: 'd January';
    Measures_delta_measure_cost_02    @title: 'd February';
    Measures_delta_measure_cost_03    @title: 'd March';
    Measures_delta_measure_cost_04    @title: 'd April';
    Measures_delta_measure_cost_05    @title: 'd May';
    Measures_delta_measure_cost_06    @title: 'd June';
    Measures_delta_measure_cost_07    @title: 'd July';
    Measures_delta_measure_cost_08    @title: 'd August';
    Measures_delta_measure_cost_09    @title: 'd September';
    Measures_delta_measure_cost_10    @title: 'd October';
    Measures_delta_measure_cost_11    @title: 'd November';
    Measures_delta_measure_cost_12    @title: 'd December';
    Measures_delta_measure_costPct_01 @title: 'd% January';
    Measures_delta_measure_costPct_02 @title: 'd% February';
    Measures_delta_measure_costPct_03 @title: 'd% March';
    Measures_delta_measure_costPct_04 @title: 'd% April';
    Measures_delta_measure_costPct_05 @title: 'd% May';
    Measures_delta_measure_costPct_06 @title: 'd% June';
    Measures_delta_measure_costPct_07 @title: 'd% July';
    Measures_delta_measure_costPct_08 @title: 'd% August';
    Measures_delta_measure_costPct_09 @title: 'd% September';
    Measures_delta_measure_costPct_10 @title: 'd% October';
    Measures_delta_measure_costPct_11 @title: 'd% November';
    Measures_delta_measure_costPct_12 @title: 'd% December';
};

annotate service.CommercialMeasuresForYears with @(UI: {
    PresentationVariant: {
        $Type                : 'UI.PresentationVariantType',
        Visualizations       : [@UI.LineItem],
        InitialExpansionLevel: 3
    },
    SelectionFields    : [reportYear],
    LineItem           : [
        // {
        //     Value                : AccountStructureItem_label,
        //     ![@HTML5.CssDefaults]: {width: '25rem'}
        // },
        {
            Value                : reportYear,
            ![@HTML5.CssDefaults]: {width: '4rem'}
        },
        {
            Value                : Measures_measure_cost_01,
            ![@HTML5.CssDefaults]: {width: '9rem'}
        },
        // {
        //     Value                : Measures_delta_measure_cost_01,
        //     ![@HTML5.CssDefaults]: {width: '9rem'}
        // },
        // {
        //     Value                : Measures_delta_measure_costPct_01,
        //     ![@HTML5.CssDefaults]: {width: '7rem'}
        // },
        {
            Value                : Measures_measure_cost_02,
            ![@HTML5.CssDefaults]: {width: '9rem'}
        },
        {
            Value                : Measures_measure_cost_03,
            ![@HTML5.CssDefaults]: {width: '9rem'}
        },
        {
            Value                : Measures_measure_cost_04,
            ![@HTML5.CssDefaults]: {width: '9rem'}
        },
        {
            Value                : Measures_measure_cost_05,
            ![@HTML5.CssDefaults]: {width: '9rem'}
        },
        {
            Value                : Measures_measure_cost_06,
            ![@HTML5.CssDefaults]: {width: '9rem'}
        },
        {
            Value                : Measures_measure_cost_07,
            ![@HTML5.CssDefaults]: {width: '9rem'}
        },
        {
            Value                : Measures_measure_cost_08,
            ![@HTML5.CssDefaults]: {width: '9rem'}
        },
        {
            Value                : Measures_measure_cost_09,
            ![@HTML5.CssDefaults]: {width: '9rem'}
        },
        {
            Value                : Measures_measure_cost_10,
            ![@HTML5.CssDefaults]: {width: '9rem'}
        },
        {
            Value                : Measures_measure_cost_11,
            ![@HTML5.CssDefaults]: {width: '9rem'}
        },
        {
            Value                : Measures_measure_cost_12,
            ![@HTML5.CssDefaults]: {width: '9rem'}
        }
    ]
});

annotate service.CommercialMeasuresForYearByTags with @(Capabilities: {FilterRestrictions: {
    $Type             : 'Capabilities.FilterRestrictionsType',
    RequiredProperties: [
        reportYear,
        Tag_name,
        Tag_value
    ]
}}) {
    Tag_name                          @(
        sap.filter.restriction: 'single-value',
        Common                : {
            ValueListWithFixedValues: true,
            ValueList               : {
                CollectionPath: 'unique_tagNames',
                Parameters    : [{
                    $Type            : 'Common.ValueListParameterOut',
                    ValueListProperty: 'tag_name',
                    LocalDataProperty: 'Tag_name'
                }]
            }
        }
    );
    Tag_value                         @(
        sap.filter.restriction: 'single-value',
        Common                : {
            ValueListWithFixedValues: true,
            ValueList               : {
                CollectionPath: 'unique_tagValues',
                Parameters    : [{
                    $Type            : 'Common.ValueListParameterOut',
                    ValueListProperty: 'tag_value',
                    LocalDataProperty: 'Tag_value'
                }]
            }
        }
    );
    Tag_name                          @title: 'Tag Name';
    Tag_value                         @title: 'Tag Value';
    Tag_label                         @title: 'Tag Allocation';
    Measures_measure_cost_01          @title: 'January';
    Measures_measure_cost_02          @title: 'February';
    Measures_measure_cost_03          @title: 'March';
    Measures_measure_cost_04          @title: 'April';
    Measures_measure_cost_05          @title: 'May';
    Measures_measure_cost_06          @title: 'June';
    Measures_measure_cost_07          @title: 'July';
    Measures_measure_cost_08          @title: 'August';
    Measures_measure_cost_09          @title: 'September';
    Measures_measure_cost_10          @title: 'October';
    Measures_measure_cost_11          @title: 'November';
    Measures_measure_cost_12          @title: 'December';
    Measures_delta_measure_cost_01    @title: 'd January';
    Measures_delta_measure_cost_02    @title: 'd February';
    Measures_delta_measure_cost_03    @title: 'd March';
    Measures_delta_measure_cost_04    @title: 'd April';
    Measures_delta_measure_cost_05    @title: 'd May';
    Measures_delta_measure_cost_06    @title: 'd June';
    Measures_delta_measure_cost_07    @title: 'd July';
    Measures_delta_measure_cost_08    @title: 'd August';
    Measures_delta_measure_cost_09    @title: 'd September';
    Measures_delta_measure_cost_10    @title: 'd October';
    Measures_delta_measure_cost_11    @title: 'd November';
    Measures_delta_measure_cost_12    @title: 'd December';
    Measures_delta_measure_costPct_01 @title: 'd% January';
    Measures_delta_measure_costPct_02 @title: 'd% February';
    Measures_delta_measure_costPct_03 @title: 'd% March';
    Measures_delta_measure_costPct_04 @title: 'd% April';
    Measures_delta_measure_costPct_05 @title: 'd% May';
    Measures_delta_measure_costPct_06 @title: 'd% June';
    Measures_delta_measure_costPct_07 @title: 'd% July';
    Measures_delta_measure_costPct_08 @title: 'd% August';
    Measures_delta_measure_costPct_09 @title: 'd% September';
    Measures_delta_measure_costPct_10 @title: 'd% October';
    Measures_delta_measure_costPct_11 @title: 'd% November';
    Measures_delta_measure_costPct_12 @title: 'd% December';
};

annotate service.CommercialMeasuresForYearByTags with @(UI: {
    SelectionPresentationVariant #NoInheritance: {
        $Type              : 'UI.SelectionPresentationVariantType',
        Text               : 'Hide Tag Inheritance',
        PresentationVariant: {
            $Type                : 'UI.PresentationVariantType',
            Visualizations       : [@UI.LineItem],
            InitialExpansionLevel: 3
        }
    },
    PresentationVariant                        : {
        $Type                : 'UI.PresentationVariantType',
        Visualizations       : [@UI.LineItem],
        InitialExpansionLevel: 3
    },
    SelectionFields                            : [
        reportYear,
        Tag_name,
        Tag_value
    ],
    LineItem                                   : [
        // {
        //     Value                : AccountStructureItem_label,
        //     ![@HTML5.CssDefaults]: {width: '25rem'}
        // },
        {
            Value                : reportYear,
            ![@HTML5.CssDefaults]: {width: '4rem'}
        },
        {
            Value                : Tag_label,
            ![@HTML5.CssDefaults]: {width: '10rem'}
        },
        {
            Value                : Measures_measure_cost_01,
            ![@HTML5.CssDefaults]: {width: '9rem'}
        },
        // {
        //     Value                : Measures_delta_measure_cost_01,
        //     ![@HTML5.CssDefaults]: {width: '9rem'}
        // },
        // {
        //     Value                : Measures_delta_measure_costPct_01,
        //     ![@HTML5.CssDefaults]: {width: '7rem'}
        // },
        {
            Value                : Measures_measure_cost_02,
            ![@HTML5.CssDefaults]: {width: '9rem'}
        },
        {
            Value                : Measures_measure_cost_03,
            ![@HTML5.CssDefaults]: {width: '9rem'}
        },
        {
            Value                : Measures_measure_cost_04,
            ![@HTML5.CssDefaults]: {width: '9rem'}
        },
        {
            Value                : Measures_measure_cost_05,
            ![@HTML5.CssDefaults]: {width: '9rem'}
        },
        {
            Value                : Measures_measure_cost_06,
            ![@HTML5.CssDefaults]: {width: '9rem'}
        },
        {
            Value                : Measures_measure_cost_07,
            ![@HTML5.CssDefaults]: {width: '9rem'}
        },
        {
            Value                : Measures_measure_cost_08,
            ![@HTML5.CssDefaults]: {width: '9rem'}
        },
        {
            Value                : Measures_measure_cost_09,
            ![@HTML5.CssDefaults]: {width: '9rem'}
        },
        {
            Value                : Measures_measure_cost_10,
            ![@HTML5.CssDefaults]: {width: '9rem'}
        },
        {
            Value                : Measures_measure_cost_11,
            ![@HTML5.CssDefaults]: {width: '9rem'}
        },
        {
            Value                : Measures_measure_cost_12,
            ![@HTML5.CssDefaults]: {width: '9rem'}
        }
    ]
});

annotate service.CommercialMeasuresForYearByTagsWInheritances with @(Capabilities: {FilterRestrictions: {
    $Type             : 'Capabilities.FilterRestrictionsType',
    RequiredProperties: [
        reportYear,
        Tag_name,
        Tag_value
    ]
}}) {
    Tag_name                          @(
        sap.filter.restriction: 'single-value',
        Common                : {
            ValueListWithFixedValues: true,
            ValueList               : {
                CollectionPath: 'unique_tagNames',
                Parameters    : [{
                    $Type            : 'Common.ValueListParameterOut',
                    ValueListProperty: 'tag_name',
                    LocalDataProperty: 'Tag_name'
                }]
            }
        }
    );
    Tag_value                         @(
        sap.filter.restriction: 'single-value',
        Common                : {
            ValueListWithFixedValues: true,
            ValueList               : {
                CollectionPath: 'unique_tagValues',
                Parameters    : [{
                    $Type            : 'Common.ValueListParameterOut',
                    ValueListProperty: 'tag_value',
                    LocalDataProperty: 'Tag_value'
                }]
            }
        }
    );
    Tag_name                          @title: 'Tag Name';
    Tag_value                         @title: 'Tag Value';
    Tag_label                         @title: 'Tag Allocation';
    Measures_measure_cost_01          @title: 'January';
    Measures_measure_cost_02          @title: 'February';
    Measures_measure_cost_03          @title: 'March';
    Measures_measure_cost_04          @title: 'April';
    Measures_measure_cost_05          @title: 'May';
    Measures_measure_cost_06          @title: 'June';
    Measures_measure_cost_07          @title: 'July';
    Measures_measure_cost_08          @title: 'August';
    Measures_measure_cost_09          @title: 'September';
    Measures_measure_cost_10          @title: 'October';
    Measures_measure_cost_11          @title: 'November';
    Measures_measure_cost_12          @title: 'December';
    Measures_delta_measure_cost_01    @title: 'd January';
    Measures_delta_measure_cost_02    @title: 'd February';
    Measures_delta_measure_cost_03    @title: 'd March';
    Measures_delta_measure_cost_04    @title: 'd April';
    Measures_delta_measure_cost_05    @title: 'd May';
    Measures_delta_measure_cost_06    @title: 'd June';
    Measures_delta_measure_cost_07    @title: 'd July';
    Measures_delta_measure_cost_08    @title: 'd August';
    Measures_delta_measure_cost_09    @title: 'd September';
    Measures_delta_measure_cost_10    @title: 'd October';
    Measures_delta_measure_cost_11    @title: 'd November';
    Measures_delta_measure_cost_12    @title: 'd December';
    Measures_delta_measure_costPct_01 @title: 'd% January';
    Measures_delta_measure_costPct_02 @title: 'd% February';
    Measures_delta_measure_costPct_03 @title: 'd% March';
    Measures_delta_measure_costPct_04 @title: 'd% April';
    Measures_delta_measure_costPct_05 @title: 'd% May';
    Measures_delta_measure_costPct_06 @title: 'd% June';
    Measures_delta_measure_costPct_07 @title: 'd% July';
    Measures_delta_measure_costPct_08 @title: 'd% August';
    Measures_delta_measure_costPct_09 @title: 'd% September';
    Measures_delta_measure_costPct_10 @title: 'd% October';
    Measures_delta_measure_costPct_11 @title: 'd% November';
    Measures_delta_measure_costPct_12 @title: 'd% December';
};

annotate service.CommercialMeasuresForYearByTagsWInheritances with @(UI: {
    SelectionPresentationVariant #WithInheritance: {
        $Type              : 'UI.SelectionPresentationVariantType',
        Text               : 'Show Tag Inheritance',
        PresentationVariant: {
            $Type                : 'UI.PresentationVariantType',
            Visualizations       : [@UI.LineItem],
            InitialExpansionLevel: 3
        }
    },
    PresentationVariant                          : {
        $Type                : 'UI.PresentationVariantType',
        Visualizations       : [@UI.LineItem],
        InitialExpansionLevel: 3
    },
    SelectionFields                              : [
        reportYear,
        Tag_name,
        Tag_value
    ],
    LineItem                                     : [
        // {
        //     Value                : AccountStructureItem_label,
        //     ![@HTML5.CssDefaults]: {width: '25rem'}
        // },
        {
            Value                : reportYear,
            ![@HTML5.CssDefaults]: {width: '4rem'}
        },
        {
            Value                : Tag_label,
            ![@HTML5.CssDefaults]: {width: '10rem'}
        },
        {
            Value                : Measures_measure_cost_01,
            ![@HTML5.CssDefaults]: {width: '9rem'}
        },
        // {
        //     Value                : Measures_delta_measure_cost_01,
        //     ![@HTML5.CssDefaults]: {width: '9rem'}
        // },
        // {
        //     Value                : Measures_delta_measure_costPct_01,
        //     ![@HTML5.CssDefaults]: {width: '7rem'}
        // },
        {
            Value                : Measures_measure_cost_02,
            ![@HTML5.CssDefaults]: {width: '9rem'}
        },
        {
            Value                : Measures_measure_cost_03,
            ![@HTML5.CssDefaults]: {width: '9rem'}
        },
        {
            Value                : Measures_measure_cost_04,
            ![@HTML5.CssDefaults]: {width: '9rem'}
        },
        {
            Value                : Measures_measure_cost_05,
            ![@HTML5.CssDefaults]: {width: '9rem'}
        },
        {
            Value                : Measures_measure_cost_06,
            ![@HTML5.CssDefaults]: {width: '9rem'}
        },
        {
            Value                : Measures_measure_cost_07,
            ![@HTML5.CssDefaults]: {width: '9rem'}
        },
        {
            Value                : Measures_measure_cost_08,
            ![@HTML5.CssDefaults]: {width: '9rem'}
        },
        {
            Value                : Measures_measure_cost_09,
            ![@HTML5.CssDefaults]: {width: '9rem'}
        },
        {
            Value                : Measures_measure_cost_10,
            ![@HTML5.CssDefaults]: {width: '9rem'}
        },
        {
            Value                : Measures_measure_cost_11,
            ![@HTML5.CssDefaults]: {width: '9rem'}
        },
        {
            Value                : Measures_measure_cost_12,
            ![@HTML5.CssDefaults]: {width: '9rem'}
        }
    ]
});

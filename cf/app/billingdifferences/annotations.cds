using ContractService as service from '../../srv/contractService';

annotate service.unique_globalAccountNames with {
    ID  @Common.Text: name  @Common.TextArrangement: #TextOnly;
}

annotate service.BillingDifferences with {
    globalAccountId @(Common: {
        ValueListWithFixedValues: true,
        ValueList               : {
            CollectionPath: 'unique_globalAccountNames',
            Parameters    : [{
                $Type            : 'Common.ValueListParameterInOut',
                ValueListProperty: 'ID',
                LocalDataProperty: 'globalAccountId'
            }]
        }
    });
}

annotate service.BillingDifferences with {
    globalAccountId               @Common.Text: globalAccountName    @Common.TextArrangement: #TextOnly;
    globalAccountId               @title      : 'Global Account';
    Credits_balance_consumed      @title      : 'Final Credits'      @Measures.ISOCurrency  : null;
    Measures_cost                 @title      : 'Estimated Cost'     @Measures.ISOCurrency  : null;
    Measures_paygCost             @title      : 'Pay Go Cost'        @Measures.ISOCurrency  : null;
    Measures_cloudCreditsCost     @title      : 'Estimated Credits'  @Measures.ISOCurrency  : null;
    Billing_difference            @title      : 'Difference'         @Measures.ISOCurrency  : null;
    Credits_cloudCreditsForPhase  @title      : 'Contract Value'     @Measures.ISOCurrency  : null;
    currency                      @title      : 'Currency';
    Credits_phaseStartDate        @title      : 'Contract Phase';
    reportYearMonth               @title      : 'Month';
    status                        @title      : 'Assessment';
}

annotate service.BillingDifferences with @(UI: {
    PresentationVariant: {
        $Type         : 'UI.PresentationVariantType',
        Visualizations: [@UI.LineItem],
        SortOrder     : [
            {
                Property  : Credits_phaseStartDate,
                Descending: true
            },
            {
                Property  : reportYearMonth,
                Descending: true
            }
        ],
        GroupBy       : [Credits_phaseStartDate]
    },
    SelectionFields    : [globalAccountId],
    Identification     : [

    ],
    LineItem           : {
        ![@UI.Criticality]: criticality,
        $value            : [
            {
                Value                : globalAccountId,
                ![@HTML5.CssDefaults]: {width: '18rem'}
            },
            {
                Value                : reportYearMonth,
                ![@HTML5.CssDefaults]: {width: '10rem'}
            },
            {
                Value                : currency,
                ![@HTML5.CssDefaults]: {width: '5rem'}
            },
            {
                Value                : Measures_cost,
                ![@HTML5.CssDefaults]: {width: '8rem'}
            },
            {
                Value                    : Measures_cloudCreditsCost,
                Criticality              : criticality,
                CriticalityRepresentation: #WithoutIcon,
                ![@HTML5.CssDefaults]    : {width: '8rem'}
            },
            {
                Value                : Measures_paygCost,
                ![@HTML5.CssDefaults]: {width: '8rem'}
            },
            {
                Value                    : Credits_balance_consumed,
                Criticality              : criticality,
                CriticalityRepresentation: #WithoutIcon,
                ![@HTML5.CssDefaults]    : {width: '8rem'}
            },
            {
                Value                    : Billing_difference,
                Criticality              : criticality,
                CriticalityRepresentation: #WithoutIcon,
                ![@HTML5.CssDefaults]    : {width: '8rem'}
            },
            {
                Value                    : status,
                Criticality              : criticality,
                CriticalityRepresentation: #WithIcon,
                ![@HTML5.CssDefaults]    : {width: '10rem'}
            },
            // {
            //     Value                : Credits_cloudCreditsForPhase,
            //     ![@HTML5.CssDefaults]: {width: '7rem'},
            //     ![@UI.Importance]    : #Medium
            // }
            {
                Value                : Credits_phaseStartDate,
                ![@HTML5.CssDefaults]: {width: '10rem'},
                ![@UI.Importance]    : #Low // Not important as is just the groupby element
            }
        ]
    }
});

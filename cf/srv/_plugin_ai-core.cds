using db from '../db/schema';
using PresentationService from './presentationService';

extend projection PresentationService.BTPServices with {
    plugin_aicore : Association to many Plugin_AICore.ModelDataPoints
                        on  plugin_aicore.reportYearMonth = reportYearMonth
                        and plugin_aicore.retrieved       = retrieved
                        and plugin_aicore.interval        = interval
                        and serviceId                     = 'ai-core'
};

service Plugin_AICore {
    @readonly
    entity ModelUsages     as
        projection on db.TechnicalMeasures {
            key toMetric.toService.reportYearMonth,
            key toMetric.toService.retrieved,
            key toMetric.toService.interval,
            key accountStructureItem.toParent.name                                           as instance,
            key name                                                                         as model,
                sum((toMetric.measureId = 'input_tokens' ? measure.usage : 0))               as inputTokens        : Decimal(20, 2),
                sum((toMetric.measureId = 'output_tokens' ? measure.usage : 0))              as outputTokens       : Decimal(20, 2),
                sum((toMetric.measureId = 'genai_token' ? measure.usage : 0))                as genAITokens        : Decimal(20, 2),
                sum((toMetric.measureId = 'capacity_units_genai_token' ? measure.usage : 0)) as capacityUnitsGenAI : Decimal(20, 2),
                sum((toMetric.measureId = 'capacity_units' ? measure.usage : 0))             as capacityUnits      : Decimal(20, 2)
        }
        where
            (
                    toMetric.toService.serviceId = 'ai-core'
                and level                        = 'Application'
            )
        group by
            toMetric.toService.reportYearMonth,
            toMetric.toService.retrieved,
            toMetric.toService.interval,
            accountStructureItem.toParent.name,
            name;

    @readonly
    entity ModelCosts      as
        projection on db.CommercialMeasures {
            key toMetric.toService.reportYearMonth,
            key toMetric.toService.retrieved,
            key toMetric.toService.interval,
            key currency,
            key accountStructureItem.toParent.name                              as instance,
            key name                                                            as model,
                sum((toMetric.measureId = 'capacity_units' ? measure.cost : 0)) as capacityUnits : Decimal(20, 2) @Measures.ISOCurrency: currency
        }
        where
            (
                    toMetric.toService.serviceId = 'ai-core'
                and level                        = 'Application'
            )
        group by
            toMetric.toService.reportYearMonth,
            toMetric.toService.retrieved,
            toMetric.toService.interval,
            currency,
            accountStructureItem.toParent.name,
            name;

    @readonly
    entity ModelDataPoints as
        select
            key mu.reportYearMonth,
            key mu.retrieved,
            key mu.interval,
            key mu.instance,
            key mu.model         as modelID,
                mu.model         as modelName,
                mu.inputTokens,
                mu.outputTokens,
                mu.genAITokens,
                mu.capacityUnitsGenAI,
                mu.capacityUnits,
                mc.capacityUnits as cost,
                mc.currency
        from ModelUsages as mu
        left outer join ModelCosts as mc
            on  mu.reportYearMonth = mc.reportYearMonth
            and mu.retrieved       = mc.retrieved
            and mu.interval        = mc.interval
            and mu.instance        = mc.instance
            and mu.model           = mc.model;
};

annotate Plugin_AICore.ModelDataPoints with @(UI: {
    PresentationVariant #Table: {
        $Type         : 'UI.PresentationVariantType',
        Visualizations: ['@UI.LineItem'],
        GroupBy       : [instance],
        SortOrder     : [
            {Property: instance},
            {Property: modelName}
        ]
    },
    PresentationVariant #Chart: {
        $Type         : 'UI.PresentationVariantType',
        Visualizations: ['@UI.Chart'],
        SortOrder     : [
            {Property: instance},
            {Property: modelName}
        ]
    },
    HeaderInfo                : {
        $Type         : 'UI.HeaderInfoType',
        TypeName      : 'Model',
        TypeNamePlural: 'Models',
        Title         : {Value: modelName},
        Description   : {Value: 'Model Usage'},
    },
    LineItem                  : [
        {
            Value                : instance,
            ![@HTML5.CssDefaults]: {width: '10rem'}
        },
        {
            Value                : modelName,
            ![@HTML5.CssDefaults]: {width: '20rem'}
        },
        {
            Value                : inputTokens,
            ![@HTML5.CssDefaults]: {width: '10rem'}
        },
        {
            Value                : outputTokens,
            ![@HTML5.CssDefaults]: {width: '10rem'}
        },
        {
            Value                : genAITokens,
            ![@HTML5.CssDefaults]: {width: '10rem'}
        },
        {
            Value                : capacityUnitsGenAI,
            ![@HTML5.CssDefaults]: {width: '10rem'}
        },
        {
            Value                : capacityUnits,
            ![@HTML5.CssDefaults]: {width: '10rem'}
        },
        {
            Value                : cost,
            ![@HTML5.CssDefaults]: {width: '10rem'}
        }
    ],
    Chart                     : {
        $Type              : 'UI.ChartDefinitionType',
        Title              : 'Model Usage',
        ChartType          : #Bubble,
        DynamicMeasures    : [
            '@Analytics.AggregatedProperty#outputTokens',
            '@Analytics.AggregatedProperty#inputTokens',
            '@Analytics.AggregatedProperty#cost',
        ],
        MeasureAttributes  : [
            {
                $Type         : 'UI.ChartMeasureAttributeType',
                DynamicMeasure: '@Analytics.AggregatedProperty#outputTokens',
                Role          : #Axis1
            },
            {
                $Type         : 'UI.ChartMeasureAttributeType',
                DynamicMeasure: '@Analytics.AggregatedProperty#inputTokens',
                Role          : #Axis2
            },
            {
                $Type         : 'UI.ChartMeasureAttributeType',
                DynamicMeasure: '@Analytics.AggregatedProperty#cost',
                Role          : #Axis3
            }
        ],
        Dimensions         : [
            instance,
            modelName
        ],
        DimensionAttributes: [{
            $Type    : 'UI.ChartDimensionAttributeType',
            Dimension: modelName,
            Role     : #Series
        }]
    }
}) {
    instance           @title: 'Resource Group';
    modelID            @title: 'Model ID';
    modelName          @title: 'Model';
    inputTokens        @title: 'Input Tokens';
    outputTokens       @title: 'Output Tokens';
    genAITokens        @title: 'GenAI Tokens';
    capacityUnits      @title: 'Capacity Units';
    capacityUnitsGenAI @title: 'GenAI Capacity Units';
    cost               @title: 'Cost';
};

annotate Plugin_AICore.ModelDataPoints with @(
    Aggregation.ApplySupported                : {
        GroupableProperties   : [
            instance,
            modelName
        ],
        AggregatableProperties: [
            {Property: inputTokens},
            {Property: outputTokens},
            {Property: cost}
        ]
    },
    Analytics.AggregatedProperty #inputTokens : {
        Name                : 'inputTokens',
        AggregationMethod   : 'sum',
        AggregatableProperty: inputTokens,
        ![@Common.Label]    : 'Input Tokens'
    },
    Analytics.AggregatedProperty #outputTokens: {
        Name                : 'outputTokens',
        AggregationMethod   : 'sum',
        AggregatableProperty: outputTokens,
        ![@Common.Label]    : 'Output Tokens'
    },
    Analytics.AggregatedProperty #cost        : {
        Name                : 'cost',
        AggregationMethod   : 'sum',
        AggregatableProperty: cost,
        ![@Common.Label]    : 'Cost'
    }
);

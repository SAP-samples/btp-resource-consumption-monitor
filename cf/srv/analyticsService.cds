using db from '../db/schema';

@requires: ['Viewer']
service AnalyticsService {

    @readonly
    entity unique_intervals                             as select distinct key interval from db.BTPServices;

    @readonly
    entity unique_tagNames                              as select distinct key name as tag_name from CombinedTags;

    @readonly
    entity unique_tagValues                             as
        select distinct
            key name  as tag_name,
            key value as tag_value
        from CombinedTags;

    @readonly
    entity unique_years                                 as
        select distinct key cast(
            YEAR(retrieved) as String(4)
        ) as year : String(4) from db.BTPServices;

    @readonly
    entity CombinedTags                                 as(
        select from db.ManagedTagAllocations as managedTags {
            key ID,
                toAccountStructureItem,
                name,
                value,
                pct
        }
    union
        select from db.CustomTags as customTags {
            key ID,
                toAccountStructureItem,
                name,
                value,
                100 as pct
        }
    );

    @readonly
    entity AccountStructureItems                        as projection on db.AccountStructureItems;

    @readonly
    entity AggregatedCommercialMeasures                 as
        projection on db.CommercialMeasures {
            key toMetric.toService.reportYearMonth,
            key toMetric.toService.retrieved,
            key toMetric.toService.interval,
                level,
                id,
                name,
                currency,
                count(toMetric.toService.serviceId) as countServices                   : Integer,
                STRING_AGG(
                    toMetric.toService.serviceName, '__' order by toMetric.toService.serviceName
                )                                   as serviceNames                    : String,
                sum(measure.cost)                   as measure_cost                    : Decimal(20, 2),
                sum(measure.paygCost)               as measure_paygCost                : Decimal(20, 2),
                sum(measure.cloudCreditsCost)       as measure_cloudCreditsCost        : Decimal(20, 2),
                sum(measure.usage)                  as measure_usage                   : Decimal(20, 2),
                sum(measure.actualUsage)            as measure_actualUsage             : Decimal(20, 2),
                sum(measure.chargedBlocks)          as measure_chargedBlocks           : Decimal(20, 2),
                sum(forecast.cost)                  as forecast_cost                   : Decimal(20, 2),
                sum(forecast.usage)                 as forecast_usage                  : Decimal(20, 2),
                sum(forecast.actualUsage)           as forecast_actualUsage            : Decimal(20, 2),
                sum(forecast.chargedBlocks)         as forecast_chargedBlocks          : Decimal(20, 2),
                sum(delta.measure.cost)             as delta_measure_cost              : Decimal(20, 2),
                sum(delta.measure.usage)            as delta_measure_usage             : Decimal(20, 2),
                sum(delta.measure.actualUsage)      as delta_measure_actualUsage       : Decimal(20, 2),
                sum(delta.measure.chargedBlocks)    as delta_measure_chargedBlocks     : Decimal(20, 2),
                sum(delta.forecast.cost)            as delta_forecast_cost             : Decimal(20, 2),
                sum(delta.forecast.usage)           as delta_forecast_usage            : Decimal(20, 2),
                sum(delta.forecast.actualUsage)     as delta_forecast_actualUsage      : Decimal(20, 2),
                sum(delta.forecast.chargedBlocks)   as delta_forecast_chargedBlocks    : Decimal(20, 2),
                ROUND(COALESCE(
                    sum(delta.measure.cost) * 100 / NULLIF(
                        sum(measure.cost)-sum(delta.measure.cost), 0
                    ), 0
                ))                                  as delta_measure_costPct           : Integer,
                ROUND(COALESCE(
                    sum(delta.measure.usage) * 100 / NULLIF(
                        sum(measure.usage)-sum(delta.measure.usage), 0
                    ), 0
                ))                                  as delta_measure_usagePct          : Integer,
                ROUND(COALESCE(
                    sum(delta.measure.actualUsage) * 100 / NULLIF(
                        sum(measure.actualUsage)-sum(delta.measure.actualUsage), 0
                    ), 0
                ))                                  as delta_measure_actualUsagePct    : Integer,
                ROUND(COALESCE(
                    sum(delta.measure.chargedBlocks) * 100 / NULLIF(
                        sum(measure.chargedBlocks)-sum(delta.measure.chargedBlocks), 0
                    ), 0
                ))                                  as delta_measure_chargedBlocksPct  : Integer,
                ROUND(COALESCE(
                    sum(delta.forecast.cost) * 100 / NULLIF(
                        sum(forecast.cost)-sum(delta.forecast.cost), 0
                    ), 0
                ))                                  as delta_forecast_costPct          : Integer,
                ROUND(COALESCE(
                    sum(delta.forecast.usage) * 100 / NULLIF(
                        sum(forecast.usage)-sum(delta.forecast.usage), 0
                    ), 0
                ))                                  as delta_forecast_usagePct         : Integer,
                ROUND(COALESCE(
                    sum(delta.forecast.actualUsage) * 100 / NULLIF(
                        sum(forecast.actualUsage)-sum(delta.forecast.actualUsage), 0
                    ), 0
                ))                                  as delta_forecast_actualUsagePct   : Integer,
                ROUND(COALESCE(
                    sum(delta.forecast.chargedBlocks) * 100 / NULLIF(
                        sum(forecast.chargedBlocks)-sum(delta.forecast.chargedBlocks), 0
                    ), 0
                ))                                  as delta_forecast_chargedBlocksPct : Integer
        }
        where
            toMetric.measureId = '_combined_'
        group by
            level,
            id,
            name,
            currency,
            toMetric.toService.reportYearMonth,
            toMetric.toService.retrieved,
            toMetric.toService.interval;


    @readonly
    entity CommercialMeasures                           as
        select
            key AllDates.retrieved,
            key AllDates.interval,
                cast(
                    YEAR(AllDates.retrieved) as String(4)
                )                                        as reportYear  : String(4),
                MONTH(AllDates.retrieved)                as reportMonth : Integer,
                Measures.reportYearMonth                 as reportYearMonth,
            key AccountStructureItem.ID                  as AccountStructureItem_ID,
                AccountStructureItem.parentID            as AccountStructureItem_parentID,
                AccountStructureItem.level               as AccountStructureItem_level,
                AccountStructureItem.name                as AccountStructureItem_name,
                AccountStructureItem.treeLevel           as AccountStructureItem_treeLevel,
                AccountStructureItem.treeState           as AccountStructureItem_treeState,
                AccountStructureItem.region              as AccountStructureItem_region,
                AccountStructureItem.environment         as AccountStructureItem_environment,
                AccountStructureItem.excluded            as AccountStructureItem_excluded,
                AccountStructureItem.lifecycle           as AccountStructureItem_lifecycle,
                AccountStructureItem.label               as AccountStructureItem_label,
                AccountStructureItem.icon                as AccountStructureItem_icon,
                Measures.currency                        as Measures_currency,
                Measures.countServices                   as Measures_countServices,
                Measures.serviceNames                    as Measures_serviceNames,
                Measures.measure_cost                    as Measures_measure_cost                    @(Measures.ISOCurrency: Measures_currency),
                Measures.measure_paygCost                as Measures_measure_paygCost                @(Measures.ISOCurrency: Measures_currency),
                Measures.measure_cloudCreditsCost        as Measures_measure_cloudCreditsCost        @(Measures.ISOCurrency: Measures_currency),
                Measures.measure_usage                   as Measures_measure_usage,
                Measures.measure_actualUsage             as Measures_measure_actualUsage,
                Measures.measure_chargedBlocks           as Measures_measure_chargedBlocks,
                Measures.forecast_cost                   as Measures_forecast_cost                   @(Measures.ISOCurrency: Measures_currency),
                Measures.forecast_usage                  as Measures_forecast_usage,
                Measures.forecast_actualUsage            as Measures_forecast_actualUsage,
                Measures.forecast_chargedBlocks          as Measures_forecast_chargedBlocks,
                Measures.delta_measure_cost              as Measures_delta_measure_cost              @(Measures.ISOCurrency: Measures_currency),
                Measures.delta_measure_usage             as Measures_delta_measure_usage,
                Measures.delta_measure_actualUsage       as Measures_delta_measure_actualUsage,
                Measures.delta_measure_chargedBlocks     as Measures_delta_measure_chargedBlocks,
                Measures.delta_forecast_cost             as Measures_delta_forecast_cost             @(Measures.ISOCurrency: Measures_currency),
                Measures.delta_forecast_usage            as Measures_delta_forecast_usage,
                Measures.delta_forecast_actualUsage      as Measures_delta_forecast_actualUsage,
                Measures.delta_forecast_chargedBlocks    as Measures_delta_forecast_chargedBlocks,
                Measures.delta_measure_costPct           as Measures_delta_measure_costPct           @(Measures.Unit: '%'),
                Measures.delta_measure_usagePct          as Measures_delta_measure_usagePct          @(Measures.Unit: '%'),
                Measures.delta_measure_actualUsagePct    as Measures_delta_measure_actualUsagePct    @(Measures.Unit: '%'),
                Measures.delta_measure_chargedBlocksPct  as Measures_delta_measure_chargedBlocksPct  @(Measures.Unit: '%'),
                Measures.delta_forecast_costPct          as Measures_delta_forecast_costPct          @(Measures.Unit: '%'),
                Measures.delta_forecast_usagePct         as Measures_delta_forecast_usagePct         @(Measures.Unit: '%'),
                Measures.delta_forecast_actualUsagePct   as Measures_delta_forecast_actualUsagePct   @(Measures.Unit: '%'),
                Measures.delta_forecast_chargedBlocksPct as Measures_delta_forecast_chargedBlocksPct @(Measures.Unit: '%')
        from AccountStructureItems as AccountStructureItem
        cross join (
            select distinct
                retrieved,
                interval
            from AggregatedCommercialMeasures
        ) as AllDates
        left join AggregatedCommercialMeasures as Measures
            on  Measures.id        = AccountStructureItem.ID
            and Measures.retrieved = AllDates.retrieved
            and Measures.interval  = AllDates.interval
        order by
            retrieved,
            interval,
            AccountStructureItem_level,
            AccountStructureItem_name;

    @readonly
    entity CommercialMeasuresByTags                     as
        select
            key retrieved,
            key interval,
                reportYear,
                reportMonth,
                reportYearMonth,
            key AccountStructureItem_ID,
                AccountStructureItem_parentID,
                AccountStructureItem_level,
                AccountStructureItem_name,
                AccountStructureItem_treeLevel,
                AccountStructureItem_treeState,
                AccountStructureItem_region,
                AccountStructureItem_environment,
                AccountStructureItem_excluded,
                AccountStructureItem_lifecycle,
                AccountStructureItem_label,
                AccountStructureItem_icon,
                AllTags.name                                                        as Tag_name,
                AllTags.value                                                       as Tag_value,
                Tag.pct                                                             as Tag_pct,
                Tag.value || ' (' || Tag.pct || '%)'                                as Tag_label                                : String,
                Measures_currency,
                Measures_countServices,
                Measures_serviceNames,
                Measures_measure_cost * Tag.pct / 100                               as Measures_measure_cost                    : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                Measures_measure_paygCost * Tag.pct / 100                           as Measures_measure_paygCost                : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                Measures_measure_cloudCreditsCost * Tag.pct / 100                   as Measures_measure_cloudCreditsCost        : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                Measures_measure_usage * Tag.pct / 100                              as Measures_measure_usage                   : Decimal(20, 2),
                Measures_measure_actualUsage * Tag.pct / 100                        as Measures_measure_actualUsage             : Decimal(20, 2),
                Measures_measure_chargedBlocks * Tag.pct / 100                      as Measures_measure_chargedBlocks           : Decimal(20, 2),
                Measures_forecast_cost * Tag.pct / 100                              as Measures_forecast_cost                   : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                Measures_forecast_usage * Tag.pct / 100                             as Measures_forecast_usage                  : Decimal(20, 2),
                Measures_forecast_actualUsage * Tag.pct / 100                       as Measures_forecast_actualUsage            : Decimal(20, 2),
                Measures_forecast_chargedBlocks * Tag.pct / 100                     as Measures_forecast_chargedBlocks          : Decimal(20, 2),
                Measures_delta_measure_cost * Tag.pct / 100                         as Measures_delta_measure_cost              : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                Measures_delta_measure_usage * Tag.pct / 100                        as Measures_delta_measure_usage             : Decimal(20, 2),
                Measures_delta_measure_actualUsage * Tag.pct / 100                  as Measures_delta_measure_actualUsage       : Decimal(20, 2),
                Measures_delta_measure_chargedBlocks * Tag.pct / 100                as Measures_delta_measure_chargedBlocks     : Decimal(20, 2),
                Measures_delta_forecast_cost * Tag.pct / 100                        as Measures_delta_forecast_cost             : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                Measures_delta_forecast_usage * Tag.pct / 100                       as Measures_delta_forecast_usage            : Decimal(20, 2),
                Measures_delta_forecast_actualUsage * Tag.pct / 100                 as Measures_delta_forecast_actualUsage      : Decimal(20, 2),
                Measures_delta_forecast_chargedBlocks * Tag.pct / 100               as Measures_delta_forecast_chargedBlocks    : Decimal(20, 2),
                (Tag.pct is null ? null : Measures_delta_measure_costPct)           as Measures_delta_measure_costPct           : Integer        @(Measures.Unit: '%'),
                (Tag.pct is null ? null : Measures_delta_measure_usagePct)          as Measures_delta_measure_usagePct          : Integer        @(Measures.Unit: '%'),
                (Tag.pct is null ? null : Measures_delta_measure_actualUsagePct)    as Measures_delta_measure_actualUsagePct    : Integer        @(Measures.Unit: '%'),
                (Tag.pct is null ? null : Measures_delta_measure_chargedBlocksPct)  as Measures_delta_measure_chargedBlocksPct  : Integer        @(Measures.Unit: '%'),
                (Tag.pct is null ? null : Measures_delta_forecast_costPct)          as Measures_delta_forecast_costPct          : Integer        @(Measures.Unit: '%'),
                (Tag.pct is null ? null : Measures_delta_forecast_usagePct)         as Measures_delta_forecast_usagePct         : Integer        @(Measures.Unit: '%'),
                (Tag.pct is null ? null : Measures_delta_forecast_actualUsagePct)   as Measures_delta_forecast_actualUsagePct   : Integer        @(Measures.Unit: '%'),
                (Tag.pct is null ? null : Measures_delta_forecast_chargedBlocksPct) as Measures_delta_forecast_chargedBlocksPct : Integer        @(Measures.Unit: '%')
        from CommercialMeasures
        cross join (
            select distinct
                name,
                value
            from CombinedTags
        ) as AllTags
        left join CombinedTags as Tag
            on  Tag.toAccountStructureItem.ID = AccountStructureItem_ID
            and Tag.name                      = AllTags.name
            and Tag.value                     = AllTags.value
        where
            AccountStructureItem_excluded = false
        order by
            retrieved,
            interval,
            AccountStructureItem_level,
            AccountStructureItem_name,
            Tag_name,
            Tag_value;

    @readonly
    entity CommercialMeasuresByTagsWInheritances       as
        select
            key retrieved,
            key interval,
                reportYear,
                reportMonth,
                reportYearMonth,
            key AccountStructureItem_ID,
                AccountStructureItem_parentID,
                AccountStructureItem_level,
                AccountStructureItem_name,
                AccountStructureItem_treeLevel,
                AccountStructureItem_treeState,
                AccountStructureItem_region,
                AccountStructureItem_environment,
                AccountStructureItem_excluded,
                AccountStructureItem_lifecycle,
                AccountStructureItem_label,
                AccountStructureItem_icon,
                AllTags.name                                                        as Tag_name,
                AllTags.value                                                       as Tag_value,
                COALESCE(DirectTag.pct, InheritedTag.pct)                          as Tag_pct:Integer,
                COALESCE(DirectTag.value, InheritedTag.value) || ' (' || COALESCE(DirectTag.pct, InheritedTag.pct) || '%)'  as Tag_label : String,
                Measures_currency,
                Measures_countServices,
                Measures_serviceNames,
                Measures_measure_cost * COALESCE(DirectTag.pct, InheritedTag.pct) / 100                               as Measures_measure_cost                    : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                Measures_measure_paygCost * COALESCE(DirectTag.pct, InheritedTag.pct) / 100                           as Measures_measure_paygCost                : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                Measures_measure_cloudCreditsCost * COALESCE(DirectTag.pct, InheritedTag.pct) / 100                   as Measures_measure_cloudCreditsCost        : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                Measures_measure_usage * COALESCE(DirectTag.pct, InheritedTag.pct) / 100                              as Measures_measure_usage                   : Decimal(20, 2),
                Measures_measure_actualUsage * COALESCE(DirectTag.pct, InheritedTag.pct) / 100                        as Measures_measure_actualUsage             : Decimal(20, 2),
                Measures_measure_chargedBlocks * COALESCE(DirectTag.pct, InheritedTag.pct) / 100                      as Measures_measure_chargedBlocks           : Decimal(20, 2),
                Measures_forecast_cost * COALESCE(DirectTag.pct, InheritedTag.pct) / 100                              as Measures_forecast_cost                   : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                Measures_forecast_usage * COALESCE(DirectTag.pct, InheritedTag.pct) / 100                             as Measures_forecast_usage                  : Decimal(20, 2),
                Measures_forecast_actualUsage * COALESCE(DirectTag.pct, InheritedTag.pct) / 100                       as Measures_forecast_actualUsage            : Decimal(20, 2),
                Measures_forecast_chargedBlocks * COALESCE(DirectTag.pct, InheritedTag.pct) / 100                     as Measures_forecast_chargedBlocks          : Decimal(20, 2),
                Measures_delta_measure_cost * COALESCE(DirectTag.pct, InheritedTag.pct) / 100                         as Measures_delta_measure_cost              : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                Measures_delta_measure_usage * COALESCE(DirectTag.pct, InheritedTag.pct) / 100                        as Measures_delta_measure_usage             : Decimal(20, 2),
                Measures_delta_measure_actualUsage * COALESCE(DirectTag.pct, InheritedTag.pct) / 100                  as Measures_delta_measure_actualUsage       : Decimal(20, 2),
                Measures_delta_measure_chargedBlocks * COALESCE(DirectTag.pct, InheritedTag.pct) / 100                as Measures_delta_measure_chargedBlocks     : Decimal(20, 2),
                Measures_delta_forecast_cost * COALESCE(DirectTag.pct, InheritedTag.pct) / 100                        as Measures_delta_forecast_cost             : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                Measures_delta_forecast_usage * COALESCE(DirectTag.pct, InheritedTag.pct) / 100                       as Measures_delta_forecast_usage            : Decimal(20, 2),
                Measures_delta_forecast_actualUsage * COALESCE(DirectTag.pct, InheritedTag.pct) / 100                 as Measures_delta_forecast_actualUsage      : Decimal(20, 2),
                Measures_delta_forecast_chargedBlocks * COALESCE(DirectTag.pct, InheritedTag.pct) / 100               as Measures_delta_forecast_chargedBlocks    : Decimal(20, 2),
                (COALESCE(DirectTag.pct, InheritedTag.pct) is null ? null : Measures_delta_measure_costPct)           as Measures_delta_measure_costPct           : Integer        @(Measures.Unit: '%'),
                (COALESCE(DirectTag.pct, InheritedTag.pct) is null ? null : Measures_delta_measure_usagePct)          as Measures_delta_measure_usagePct          : Integer        @(Measures.Unit: '%'),
                (COALESCE(DirectTag.pct, InheritedTag.pct) is null ? null : Measures_delta_measure_actualUsagePct)    as Measures_delta_measure_actualUsagePct    : Integer        @(Measures.Unit: '%'),
                (COALESCE(DirectTag.pct, InheritedTag.pct) is null ? null : Measures_delta_measure_chargedBlocksPct)  as Measures_delta_measure_chargedBlocksPct  : Integer        @(Measures.Unit: '%'),
                (COALESCE(DirectTag.pct, InheritedTag.pct) is null ? null : Measures_delta_forecast_costPct)          as Measures_delta_forecast_costPct          : Integer        @(Measures.Unit: '%'),
                (COALESCE(DirectTag.pct, InheritedTag.pct) is null ? null : Measures_delta_forecast_usagePct)         as Measures_delta_forecast_usagePct         : Integer        @(Measures.Unit: '%'),
                (COALESCE(DirectTag.pct, InheritedTag.pct) is null ? null : Measures_delta_forecast_actualUsagePct)   as Measures_delta_forecast_actualUsagePct   : Integer        @(Measures.Unit: '%'),
                (COALESCE(DirectTag.pct, InheritedTag.pct) is null ? null : Measures_delta_forecast_chargedBlocksPct) as Measures_delta_forecast_chargedBlocksPct : Integer        @(Measures.Unit: '%')
        from CommercialMeasures
        cross join (
            select distinct
                name,
                value
            from CombinedTags
        ) as AllTags
        left join CombinedTags as DirectTag
            on  DirectTag.toAccountStructureItem.ID = AccountStructureItem_ID
            and DirectTag.name                      = AllTags.name
            and DirectTag.value                     = AllTags.value
        left join (
            select 
                child.ID as child_id,
                tags.name,
                tags.value,
                tags.pct,
                ROW_NUMBER() OVER (
                    PARTITION BY child.ID, tags.name, tags.value 
                    ORDER BY 
                        CASE 
                            WHEN tags.toAccountStructureItem.ID = parent1.ID THEN 1
                            WHEN tags.toAccountStructureItem.ID = parent2.ID THEN 2
                            WHEN tags.toAccountStructureItem.ID = parent3.ID THEN 3
                            WHEN tags.toAccountStructureItem.ID = parent4.ID THEN 4
                            WHEN tags.toAccountStructureItem.ID = parent5.ID THEN 5
                            WHEN tags.toAccountStructureItem.ID = parent6.ID THEN 6
                            WHEN tags.toAccountStructureItem.ID = parent7.ID THEN 7
                            ELSE 8
                        END ASC
                ) as rn
            from AccountStructureItems as child
            left join AccountStructureItems as parent1 on parent1.ID = child.parentID
            left join AccountStructureItems as parent2 on parent2.ID = parent1.parentID
            left join AccountStructureItems as parent3 on parent3.ID = parent2.parentID
            left join AccountStructureItems as parent4 on parent4.ID = parent3.parentID
            left join AccountStructureItems as parent5 on parent5.ID = parent4.parentID
            left join AccountStructureItems as parent6 on parent6.ID = parent5.parentID
            left join AccountStructureItems as parent7 on parent7.ID = parent6.parentID
            join CombinedTags as tags on (
                tags.toAccountStructureItem.ID = parent1.ID OR
                tags.toAccountStructureItem.ID = parent2.ID OR
                tags.toAccountStructureItem.ID = parent3.ID OR
                tags.toAccountStructureItem.ID = parent4.ID OR
                tags.toAccountStructureItem.ID = parent5.ID OR
                tags.toAccountStructureItem.ID = parent6.ID OR
                tags.toAccountStructureItem.ID = parent7.ID
            )
            where tags.name != 'Hierarchy'
        ) as InheritedTag
            on  InheritedTag.child_id = AccountStructureItem_ID
            and InheritedTag.name     = AllTags.name
            and InheritedTag.value    = AllTags.value
            and InheritedTag.rn       = 1
            and DirectTag.pct         IS NULL
        where
            AccountStructureItem_excluded = false
        order by
            retrieved,
            interval,
            AccountStructureItem_level,
            AccountStructureItem_name,
            Tag_name,
            Tag_value;

    @readonly
    entity CommercialMeasuresForYears                   as
        select
            key reportYear,
            key AccountStructureItem_ID,
                AccountStructureItem_parentID,
                AccountStructureItem_level,
                AccountStructureItem_name,
                AccountStructureItem_treeLevel,
                AccountStructureItem_treeState,
                AccountStructureItem_region,
                AccountStructureItem_environment,
                AccountStructureItem_excluded,
                AccountStructureItem_lifecycle,
                AccountStructureItem_label,
                AccountStructureItem_icon,
                max(Measures_currency)                                          as Measures_currency                 : String,
                0                                                               as Measures_countServices            : Integer, // service handler will recount after removing duplicates
                STRING_AGG(
                    Measures_serviceNames, '__' order by Measures_serviceNames
                )                                                               as Measures_serviceNames             : String, // service handler will remove duplicates
                max((reportMonth = 1 ? Measures_measure_cost : null))           as Measures_measure_cost_01          : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                max((reportMonth = 2 ? Measures_measure_cost : null))           as Measures_measure_cost_02          : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                max((reportMonth = 3 ? Measures_measure_cost : null))           as Measures_measure_cost_03          : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                max((reportMonth = 4 ? Measures_measure_cost : null))           as Measures_measure_cost_04          : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                max((reportMonth = 5 ? Measures_measure_cost : null))           as Measures_measure_cost_05          : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                max((reportMonth = 6 ? Measures_measure_cost : null))           as Measures_measure_cost_06          : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                max((reportMonth = 7 ? Measures_measure_cost : null))           as Measures_measure_cost_07          : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                max((reportMonth = 8 ? Measures_measure_cost : null))           as Measures_measure_cost_08          : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                max((reportMonth = 9 ? Measures_measure_cost : null))           as Measures_measure_cost_09          : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                max((reportMonth = 10 ? Measures_measure_cost : null))          as Measures_measure_cost_10          : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                max((reportMonth = 11 ? Measures_measure_cost : null))          as Measures_measure_cost_11          : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                max((reportMonth = 12 ? Measures_measure_cost : null))          as Measures_measure_cost_12          : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                max((reportMonth = 1 ? Measures_delta_measure_cost : null))     as Measures_delta_measure_cost_01    : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                max((reportMonth = 2 ? Measures_delta_measure_cost : null))     as Measures_delta_measure_cost_02    : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                max((reportMonth = 3 ? Measures_delta_measure_cost : null))     as Measures_delta_measure_cost_03    : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                max((reportMonth = 4 ? Measures_delta_measure_cost : null))     as Measures_delta_measure_cost_04    : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                max((reportMonth = 5 ? Measures_delta_measure_cost : null))     as Measures_delta_measure_cost_05    : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                max((reportMonth = 6 ? Measures_delta_measure_cost : null))     as Measures_delta_measure_cost_06    : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                max((reportMonth = 7 ? Measures_delta_measure_cost : null))     as Measures_delta_measure_cost_07    : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                max((reportMonth = 8 ? Measures_delta_measure_cost : null))     as Measures_delta_measure_cost_08    : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                max((reportMonth = 9 ? Measures_delta_measure_cost : null))     as Measures_delta_measure_cost_09    : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                max((reportMonth = 10 ? Measures_delta_measure_cost : null))    as Measures_delta_measure_cost_10    : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                max((reportMonth = 11 ? Measures_delta_measure_cost : null))    as Measures_delta_measure_cost_11    : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                max((reportMonth = 12 ? Measures_delta_measure_cost : null))    as Measures_delta_measure_cost_12    : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                max((reportMonth = 1 ? Measures_delta_measure_costPct : null))  as Measures_delta_measure_costPct_01 : Integer        @(Measures.Unit: '%'),
                max((reportMonth = 2 ? Measures_delta_measure_costPct : null))  as Measures_delta_measure_costPct_02 : Integer        @(Measures.Unit: '%'),
                max((reportMonth = 3 ? Measures_delta_measure_costPct : null))  as Measures_delta_measure_costPct_03 : Integer        @(Measures.Unit: '%'),
                max((reportMonth = 4 ? Measures_delta_measure_costPct : null))  as Measures_delta_measure_costPct_04 : Integer        @(Measures.Unit: '%'),
                max((reportMonth = 5 ? Measures_delta_measure_costPct : null))  as Measures_delta_measure_costPct_05 : Integer        @(Measures.Unit: '%'),
                max((reportMonth = 6 ? Measures_delta_measure_costPct : null))  as Measures_delta_measure_costPct_06 : Integer        @(Measures.Unit: '%'),
                max((reportMonth = 7 ? Measures_delta_measure_costPct : null))  as Measures_delta_measure_costPct_07 : Integer        @(Measures.Unit: '%'),
                max((reportMonth = 8 ? Measures_delta_measure_costPct : null))  as Measures_delta_measure_costPct_08 : Integer        @(Measures.Unit: '%'),
                max((reportMonth = 9 ? Measures_delta_measure_costPct : null))  as Measures_delta_measure_costPct_09 : Integer        @(Measures.Unit: '%'),
                max((reportMonth = 10 ? Measures_delta_measure_costPct : null)) as Measures_delta_measure_costPct_10 : Integer        @(Measures.Unit: '%'),
                max((reportMonth = 11 ? Measures_delta_measure_costPct : null)) as Measures_delta_measure_costPct_11 : Integer        @(Measures.Unit: '%'),
                max((reportMonth = 12 ? Measures_delta_measure_costPct : null)) as Measures_delta_measure_costPct_12 : Integer        @(Measures.Unit: '%')
        from CommercialMeasures
        where
            interval = 'Monthly'
        group by
            reportYear,
            AccountStructureItem_ID,
            AccountStructureItem_parentID,
            AccountStructureItem_level,
            AccountStructureItem_name,
            AccountStructureItem_treeLevel,
            AccountStructureItem_treeState,
            AccountStructureItem_region,
            AccountStructureItem_environment,
            AccountStructureItem_excluded,
            AccountStructureItem_lifecycle,
            AccountStructureItem_label,
            AccountStructureItem_icon
        order by
            reportYear,
            AccountStructureItem_level,
            AccountStructureItem_name;

    entity CommercialMeasuresForYearByTags              as
        select
            key reportYear,
            key AccountStructureItem_ID,
                AccountStructureItem_parentID,
                AccountStructureItem_level,
                AccountStructureItem_name,
                AccountStructureItem_treeLevel,
                AccountStructureItem_treeState,
                AccountStructureItem_region,
                AccountStructureItem_environment,
                AccountStructureItem_excluded,
                AccountStructureItem_lifecycle,
                AccountStructureItem_label,
                AccountStructureItem_icon,
                AllTags.name                                                 as Tag_name,
                AllTags.value                                                as Tag_value,
                Tag.pct                                                      as Tag_pct,
                Tag.value || ' (' || Tag.pct || '%)'                         as Tag_label                         : String,
                Measures_currency,
                Measures_countServices,
                Measures_serviceNames,
                Measures_measure_cost_01 * Tag.pct / 100                     as Measures_measure_cost_01          : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                Measures_measure_cost_02 * Tag.pct / 100                     as Measures_measure_cost_02          : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                Measures_measure_cost_03 * Tag.pct / 100                     as Measures_measure_cost_03          : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                Measures_measure_cost_04 * Tag.pct / 100                     as Measures_measure_cost_04          : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                Measures_measure_cost_05 * Tag.pct / 100                     as Measures_measure_cost_05          : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                Measures_measure_cost_06 * Tag.pct / 100                     as Measures_measure_cost_06          : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                Measures_measure_cost_07 * Tag.pct / 100                     as Measures_measure_cost_07          : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                Measures_measure_cost_08 * Tag.pct / 100                     as Measures_measure_cost_08          : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                Measures_measure_cost_09 * Tag.pct / 100                     as Measures_measure_cost_09          : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                Measures_measure_cost_10 * Tag.pct / 100                     as Measures_measure_cost_10          : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                Measures_measure_cost_11 * Tag.pct / 100                     as Measures_measure_cost_11          : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                Measures_measure_cost_12 * Tag.pct / 100                     as Measures_measure_cost_12          : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                Measures_delta_measure_cost_01 * Tag.pct / 100               as Measures_delta_measure_cost_01    : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                Measures_delta_measure_cost_02 * Tag.pct / 100               as Measures_delta_measure_cost_02    : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                Measures_delta_measure_cost_03 * Tag.pct / 100               as Measures_delta_measure_cost_03    : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                Measures_delta_measure_cost_04 * Tag.pct / 100               as Measures_delta_measure_cost_04    : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                Measures_delta_measure_cost_05 * Tag.pct / 100               as Measures_delta_measure_cost_05    : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                Measures_delta_measure_cost_06 * Tag.pct / 100               as Measures_delta_measure_cost_06    : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                Measures_delta_measure_cost_07 * Tag.pct / 100               as Measures_delta_measure_cost_07    : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                Measures_delta_measure_cost_08 * Tag.pct / 100               as Measures_delta_measure_cost_08    : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                Measures_delta_measure_cost_09 * Tag.pct / 100               as Measures_delta_measure_cost_09    : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                Measures_delta_measure_cost_10 * Tag.pct / 100               as Measures_delta_measure_cost_10    : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                Measures_delta_measure_cost_11 * Tag.pct / 100               as Measures_delta_measure_cost_11    : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                Measures_delta_measure_cost_12 * Tag.pct / 100               as Measures_delta_measure_cost_12    : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                (Tag.pct is null ? null : Measures_delta_measure_costPct_01) as Measures_delta_measure_costPct_01 : Integer        @(Measures.Unit: '%'),
                (Tag.pct is null ? null : Measures_delta_measure_costPct_02) as Measures_delta_measure_costPct_02 : Integer        @(Measures.Unit: '%'),
                (Tag.pct is null ? null : Measures_delta_measure_costPct_03) as Measures_delta_measure_costPct_03 : Integer        @(Measures.Unit: '%'),
                (Tag.pct is null ? null : Measures_delta_measure_costPct_04) as Measures_delta_measure_costPct_04 : Integer        @(Measures.Unit: '%'),
                (Tag.pct is null ? null : Measures_delta_measure_costPct_05) as Measures_delta_measure_costPct_05 : Integer        @(Measures.Unit: '%'),
                (Tag.pct is null ? null : Measures_delta_measure_costPct_06) as Measures_delta_measure_costPct_06 : Integer        @(Measures.Unit: '%'),
                (Tag.pct is null ? null : Measures_delta_measure_costPct_07) as Measures_delta_measure_costPct_07 : Integer        @(Measures.Unit: '%'),
                (Tag.pct is null ? null : Measures_delta_measure_costPct_08) as Measures_delta_measure_costPct_08 : Integer        @(Measures.Unit: '%'),
                (Tag.pct is null ? null : Measures_delta_measure_costPct_09) as Measures_delta_measure_costPct_09 : Integer        @(Measures.Unit: '%'),
                (Tag.pct is null ? null : Measures_delta_measure_costPct_10) as Measures_delta_measure_costPct_10 : Integer        @(Measures.Unit: '%'),
                (Tag.pct is null ? null : Measures_delta_measure_costPct_11) as Measures_delta_measure_costPct_11 : Integer        @(Measures.Unit: '%'),
                (Tag.pct is null ? null : Measures_delta_measure_costPct_12) as Measures_delta_measure_costPct_12 : Integer        @(Measures.Unit: '%')
        from CommercialMeasuresForYears
        cross join (
            select distinct
                name,
                value
            from CombinedTags
        ) as AllTags
        left join CombinedTags as Tag
            on  Tag.toAccountStructureItem.ID = AccountStructureItem_ID
            and Tag.name                      = AllTags.name
            and Tag.value                     = AllTags.value
        where
            AccountStructureItem_excluded = false
        order by
            reportYear,
            AccountStructureItem_level,
            AccountStructureItem_name,
            Tag_name,
            Tag_value;

    @readonly
    entity CommercialMeasuresForYearByTagsWInheritances as
        select
            key reportYear,
            key AccountStructureItem_ID,
                AccountStructureItem_parentID,
                AccountStructureItem_level,
                AccountStructureItem_name,
                AccountStructureItem_treeLevel,
                AccountStructureItem_treeState,
                AccountStructureItem_region,
                AccountStructureItem_environment,
                AccountStructureItem_excluded,
                AccountStructureItem_lifecycle,
                AccountStructureItem_label,
                AccountStructureItem_icon,
                AllTags.name                                                                                     as Tag_name,
                AllTags.value                                                                                    as Tag_value,
                COALESCE(DirectTag.pct, InheritedTag.pct)                                                       as Tag_pct:Integer,
                COALESCE(DirectTag.value, InheritedTag.value) || ' (' || COALESCE(DirectTag.pct, InheritedTag.pct) || '%)'  as Tag_label : String,
                Measures_currency,
                Measures_countServices,
                Measures_serviceNames,
                Measures_measure_cost_01 * COALESCE(DirectTag.pct, InheritedTag.pct) / 100                     as Measures_measure_cost_01          : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                Measures_measure_cost_02 * COALESCE(DirectTag.pct, InheritedTag.pct) / 100                     as Measures_measure_cost_02          : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                Measures_measure_cost_03 * COALESCE(DirectTag.pct, InheritedTag.pct) / 100                     as Measures_measure_cost_03          : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                Measures_measure_cost_04 * COALESCE(DirectTag.pct, InheritedTag.pct) / 100                     as Measures_measure_cost_04          : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                Measures_measure_cost_05 * COALESCE(DirectTag.pct, InheritedTag.pct) / 100                     as Measures_measure_cost_05          : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                Measures_measure_cost_06 * COALESCE(DirectTag.pct, InheritedTag.pct) / 100                     as Measures_measure_cost_06          : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                Measures_measure_cost_07 * COALESCE(DirectTag.pct, InheritedTag.pct) / 100                     as Measures_measure_cost_07          : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                Measures_measure_cost_08 * COALESCE(DirectTag.pct, InheritedTag.pct) / 100                     as Measures_measure_cost_08          : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                Measures_measure_cost_09 * COALESCE(DirectTag.pct, InheritedTag.pct) / 100                     as Measures_measure_cost_09          : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                Measures_measure_cost_10 * COALESCE(DirectTag.pct, InheritedTag.pct) / 100                     as Measures_measure_cost_10          : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                Measures_measure_cost_11 * COALESCE(DirectTag.pct, InheritedTag.pct) / 100                     as Measures_measure_cost_11          : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                Measures_measure_cost_12 * COALESCE(DirectTag.pct, InheritedTag.pct) / 100                     as Measures_measure_cost_12          : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                Measures_delta_measure_cost_01 * COALESCE(DirectTag.pct, InheritedTag.pct) / 100               as Measures_delta_measure_cost_01    : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                Measures_delta_measure_cost_02 * COALESCE(DirectTag.pct, InheritedTag.pct) / 100               as Measures_delta_measure_cost_02    : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                Measures_delta_measure_cost_03 * COALESCE(DirectTag.pct, InheritedTag.pct) / 100               as Measures_delta_measure_cost_03    : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                Measures_delta_measure_cost_04 * COALESCE(DirectTag.pct, InheritedTag.pct) / 100               as Measures_delta_measure_cost_04    : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                Measures_delta_measure_cost_05 * COALESCE(DirectTag.pct, InheritedTag.pct) / 100               as Measures_delta_measure_cost_05    : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                Measures_delta_measure_cost_06 * COALESCE(DirectTag.pct, InheritedTag.pct) / 100               as Measures_delta_measure_cost_06    : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                Measures_delta_measure_cost_07 * COALESCE(DirectTag.pct, InheritedTag.pct) / 100               as Measures_delta_measure_cost_07    : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                Measures_delta_measure_cost_08 * COALESCE(DirectTag.pct, InheritedTag.pct) / 100               as Measures_delta_measure_cost_08    : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                Measures_delta_measure_cost_09 * COALESCE(DirectTag.pct, InheritedTag.pct) / 100               as Measures_delta_measure_cost_09    : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                Measures_delta_measure_cost_10 * COALESCE(DirectTag.pct, InheritedTag.pct) / 100               as Measures_delta_measure_cost_10    : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                Measures_delta_measure_cost_11 * COALESCE(DirectTag.pct, InheritedTag.pct) / 100               as Measures_delta_measure_cost_11    : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                Measures_delta_measure_cost_12 * COALESCE(DirectTag.pct, InheritedTag.pct) / 100               as Measures_delta_measure_cost_12    : Decimal(20, 2) @(Measures.ISOCurrency: Measures_currency),
                (COALESCE(DirectTag.pct, InheritedTag.pct) is null ? null : Measures_delta_measure_costPct_01) as Measures_delta_measure_costPct_01 : Integer        @(Measures.Unit: '%'),
                (COALESCE(DirectTag.pct, InheritedTag.pct) is null ? null : Measures_delta_measure_costPct_02) as Measures_delta_measure_costPct_02 : Integer        @(Measures.Unit: '%'),
                (COALESCE(DirectTag.pct, InheritedTag.pct) is null ? null : Measures_delta_measure_costPct_03) as Measures_delta_measure_costPct_03 : Integer        @(Measures.Unit: '%'),
                (COALESCE(DirectTag.pct, InheritedTag.pct) is null ? null : Measures_delta_measure_costPct_04) as Measures_delta_measure_costPct_04 : Integer        @(Measures.Unit: '%'),
                (COALESCE(DirectTag.pct, InheritedTag.pct) is null ? null : Measures_delta_measure_costPct_05) as Measures_delta_measure_costPct_05 : Integer        @(Measures.Unit: '%'),
                (COALESCE(DirectTag.pct, InheritedTag.pct) is null ? null : Measures_delta_measure_costPct_06) as Measures_delta_measure_costPct_06 : Integer        @(Measures.Unit: '%'),
                (COALESCE(DirectTag.pct, InheritedTag.pct) is null ? null : Measures_delta_measure_costPct_07) as Measures_delta_measure_costPct_07 : Integer        @(Measures.Unit: '%'),
                (COALESCE(DirectTag.pct, InheritedTag.pct) is null ? null : Measures_delta_measure_costPct_08) as Measures_delta_measure_costPct_08 : Integer        @(Measures.Unit: '%'),
                (COALESCE(DirectTag.pct, InheritedTag.pct) is null ? null : Measures_delta_measure_costPct_09) as Measures_delta_measure_costPct_09 : Integer        @(Measures.Unit: '%'),
                (COALESCE(DirectTag.pct, InheritedTag.pct) is null ? null : Measures_delta_measure_costPct_10) as Measures_delta_measure_costPct_10 : Integer        @(Measures.Unit: '%'),
                (COALESCE(DirectTag.pct, InheritedTag.pct) is null ? null : Measures_delta_measure_costPct_11) as Measures_delta_measure_costPct_11 : Integer        @(Measures.Unit: '%'),
                (COALESCE(DirectTag.pct, InheritedTag.pct) is null ? null : Measures_delta_measure_costPct_12) as Measures_delta_measure_costPct_12 : Integer        @(Measures.Unit: '%')
        from CommercialMeasuresForYears
        cross join (
            select distinct
                name,
                value
            from CombinedTags
        ) as AllTags
        left join CombinedTags as DirectTag
            on  DirectTag.toAccountStructureItem.ID = AccountStructureItem_ID
            and DirectTag.name                      = AllTags.name
            and DirectTag.value                     = AllTags.value
        left join (
            select 
                child.ID as child_id,
                tags.name,
                tags.value,
                tags.pct,
                ROW_NUMBER() OVER (
                    PARTITION BY child.ID, tags.name, tags.value 
                    ORDER BY 
                        CASE 
                            WHEN tags.toAccountStructureItem.ID = parent1.ID THEN 1
                            WHEN tags.toAccountStructureItem.ID = parent2.ID THEN 2
                            WHEN tags.toAccountStructureItem.ID = parent3.ID THEN 3
                            WHEN tags.toAccountStructureItem.ID = parent4.ID THEN 4
                            WHEN tags.toAccountStructureItem.ID = parent5.ID THEN 5
                            WHEN tags.toAccountStructureItem.ID = parent6.ID THEN 6
                            WHEN tags.toAccountStructureItem.ID = parent7.ID THEN 7
                            ELSE 8
                        END ASC
                ) as rn
            from AccountStructureItems as child
            left join AccountStructureItems as parent1 on parent1.ID = child.parentID
            left join AccountStructureItems as parent2 on parent2.ID = parent1.parentID
            left join AccountStructureItems as parent3 on parent3.ID = parent2.parentID
            left join AccountStructureItems as parent4 on parent4.ID = parent3.parentID
            left join AccountStructureItems as parent5 on parent5.ID = parent4.parentID
            left join AccountStructureItems as parent6 on parent6.ID = parent5.parentID
            left join AccountStructureItems as parent7 on parent7.ID = parent6.parentID
            join CombinedTags as tags on (
                tags.toAccountStructureItem.ID = parent1.ID OR
                tags.toAccountStructureItem.ID = parent2.ID OR
                tags.toAccountStructureItem.ID = parent3.ID OR
                tags.toAccountStructureItem.ID = parent4.ID OR
                tags.toAccountStructureItem.ID = parent5.ID OR
                tags.toAccountStructureItem.ID = parent6.ID OR
                tags.toAccountStructureItem.ID = parent7.ID
            )
            where tags.name != 'Hierarchy'
        ) as InheritedTag
            on  InheritedTag.child_id = AccountStructureItem_ID
            and InheritedTag.name     = AllTags.name
            and InheritedTag.value    = AllTags.value
            and InheritedTag.rn       = 1
            and DirectTag.pct         IS NULL
        where
            AccountStructureItem_excluded = false
        order by
            reportYear,
            AccountStructureItem_level,
            AccountStructureItem_name,
            Tag_name,
            Tag_value;

    @readonly
    entity CloudCreditConsumptions                      as
        select
            key COALESCE(
                    Measures.AccountStructureItem_ID, Credits.toParent.globalAccountId
                )                                                                                                                                                            as globalAccountId           : String,
            key COALESCE(
                    Measures.AccountStructureItem_name, Credits.toParent.globalAccountName
                )                                                                                                                                                            as globalAccountName         : String,
            key coalesce(
                    Measures.reportYearMonth, Credits.yearMonth
                )                                                                                                                                                            as reportYearMonth           : String,
                coalesce(
                    Measures.Measures_currency, Credits.currency
                )                                                                                                                                                            as currency                  : String,
                Credits.status                                                                                                                                               as Credits_status,
                Credits.cloudCreditsForPhase                                                                                                                                 as Credits_cloudCreditsForPhase,
                Credits.balance                                                                                                                                              as Credits_balance,
                Credits.phaseStartDate                                                                                                                                       as Credits_phaseStartDate,
                Credits.phaseUpdatedOn                                                                                                                                       as Credits_phaseUpdatedOn,
                ROUND(
                    COALESCE(
                        LAG(Credits.balance) over(partition by Credits.toParent.globalAccountId, Credits.phaseStartDate order by Credits.yearMonth)-Credits.balance, Credits.cloudCreditsForPhase - Credits.balance
                    ), 2
                )                                                                                                                                                            as Credits_balance_consumed  : Decimal(20, 2),
                Measures.Measures_measure_cost                                                                                                                               as Measures_cost,
                LatestMeasures.forecast_cost                                                                                                                                 as Forecast_cost,
                MIN(Credits.balance) over(partition by Credits.toParent.globalAccountId, Credits.phaseStartDate order by Credits.yearMonth)-SUM(LatestMeasures.forecast_cost) over(
                partition by Credits.toParent.globalAccountId, Credits.phaseStartDate order by Credits.yearMonth
            )                                                                                                                                                                as Predicted_credits_balance : Decimal(20, 2),
                Measures.Measures_measure_paygCost                                                                                                                           as Measures_paygCost,
                Measures.Measures_measure_cloudCreditsCost                                                                                                                   as Measures_cloudCreditsCost,
                AVG(Measures.Measures_measure_cost) over(partition by Credits.toParent.globalAccountId order by Credits.yearMonth rows between 2 preceding and current row)  as Measures_cost_SMA3        : Decimal(20, 2),
                AVG(Measures.Measures_measure_cost) over(partition by Credits.toParent.globalAccountId order by Credits.yearMonth rows between 5 preceding and current row)  as Measures_cost_SMA6        : Decimal(20, 2),
                AVG(Measures.Measures_measure_cost) over(partition by Credits.toParent.globalAccountId order by Credits.yearMonth rows between 11 preceding and current row) as Measures_cost_SMA12       : Decimal(20, 2)
        from db.ContractCreditValues as Credits
        full outer join (
            select
                key reportYearMonth,
                key AccountStructureItem_ID,
                    AccountStructureItem_name,
                    Measures_currency,
                    Measures_measure_cost,
                    Measures_measure_paygCost,
                    Measures_measure_cloudCreditsCost
            from CommercialMeasures
            where
                    AccountStructureItem_level =      'Global Account'
                and interval                   =      'Monthly'
                and reportYearMonth            is not null
        ) as Measures
            on  Measures.reportYearMonth         = Credits.yearMonth
            and Measures.AccountStructureItem_ID = Credits.toParent.globalAccountId
        left outer join (
            select
                key id,
                    retrieved,
                    forecast_cost
            from AggregatedCommercialMeasures as acm
            where
                (
                        acm.level     =  'Global Account'
                    and acm.retrieved in (
                        select max(retrieved) from AggregatedCommercialMeasures
                    )
                )
        ) as LatestMeasures
            on  LatestMeasures.id = Credits.toParent.globalAccountId
            and Credits.status    = 'Projection';


// function getSACStoryUrl() returns {
//     url : String
// };

}

namespace types;

/**
 * Enums
 */

type TAggregationLevel       : String enum {
    Customer;
    GlobalAccount            = 'Global Account';
    SubAccount               = 'Sub Account';
    Directory;
    Datacenter;
    Space;
    CustomTag                = 'Custom Tag'; //Not used so far
    ServiceInSubaccount      = 'Service';
    ServiceInSpace           = 'Service (alloc.)';
    InstanceOfService        = 'Instance'; // e.g. HANA Cloud database instance, or a Cloud Foundry Application
    ApplicationInService     = 'Application'; // e.g. AI Core model
}

type TInterval               : String enum {
    Monthly;
    Daily;
}

type TForecastMethod         : String enum {
    Excluded;
    TimeLinear;
    TimeDegressive
}

type TInExclude              : String enum {
    Include;
    Exclude
} default 'Include';

type TAlertType              : String enum {
    Commercial;
    Technical
}

type TServiceScopes          : String enum {
    Service;
    Metric
}

type TAccountStructureLevels : String enum {
    Customer;
    GlobalAccount            = 'Global Account';
    Directory;
    Datacenter;
    SubAccount               = 'Sub Account';
    Space;
    Instance                 = 'Environment'; // e.g. Cloud Foundry Org
    ServiceInSubaccount      = 'Service'; // e.g. HANA Cloud service created in 'Other' environment
    ServiceInSpace           = 'Service (alloc.)'; // e.g. HANA Cloud services created in a CF Space
    InstanceOfService        = 'Instance'; // e.g. HANA Cloud database instance, or a Cloud Foundry Application
    ApplicationInService     = 'Application'; // e.g. AI Core model
}

type TPasteMode              : String enum {
    Both                = 'Both Managed and Custom tags';
    Only1ManagedTags    = 'Only Managed tags';
    Only2CustomTags     = 'Only Custom tags';
}

type TCreditStatus           : String enum {
    Actual;
    Projection;
}

/**
 * Types
 */

type TBulletChart {
    value       : Decimal(20, 2);
    min         : Decimal(20, 2);
    max         : Decimal(20, 2);
    target      : Decimal(20, 2);
    forecast    : Decimal(20, 2);
    criticality : Integer;
}

type TDynamicAppLauncher {
    title        : String;
    subtitle     : String;
    icon         : String;
    info         : String;
    infoState    : String;
    number       : Decimal(20, 2);
    numberDigits : Integer;
    numberFactor : String;
    numberState  : String;
    numberUnit   : String;
    stateArrow   : String;
}

type TTag {
    name   :      String;
    values : many String;
}

type TAlertSimulation {
    table : String;
    json  : String;
    sql   : String;
}


/**
 * Action parameters
 */

type TSetForecastSettingParams {
    method           : String;
    degressionFactor : Double;
}

type TSetTechnicalMetricForAllocationParams {
    tMeasureId : String;
    metricName : String;
}

type TBulkTechnicalAllocationItem {
    serviceId  : String;
    cMeasureId : String;
    tMeasureId : String;
    metricName : String;
}

type TBulkTechnicalAllocationParams {
    allocations : many TBulkTechnicalAllocationItem;
}

type TBulkForecastSettingItem {
    serviceId        : String;
    cMeasureId       : String;
    method           : String;
    degressionFactor : Double;
}

type TBulkForecastSettingParams {
    settings : many TBulkForecastSettingItem;
}

type TPasteTagsParams {
    mode : String;
}

namespace types;

/**
 * Enums
 */

type TAggregationLevel : String enum {
    GlobalAccount;
    SubAccount;
    Directory;
    Datacenter;
    CustomTag;
}

type TInterval         : String enum {
    Monthly;
    Daily;
}

type TForecastMethod   : String enum {
    Excluded;
    TimeLinear;
    TimeDegressive
}

type TInExclude        : String enum {
    Include;
    Exclude
} default 'Include';

type TAlertType        : String enum {
    Commercial;
    Technical
}

type TServiceScopes    : String enum {
    Service;
    Metric
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

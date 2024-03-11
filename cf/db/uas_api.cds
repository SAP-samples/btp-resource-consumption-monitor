namespace api;

type TTechnicalMeasure {
    usage : Decimal(20, 2) @title: 'Usage';
}

type TCommercialMeasure {
    cost          : Decimal(20, 2) @title: 'Cost';
    usage         : Decimal(20, 2) @title: 'Usage';
    actualUsage   : Decimal(20, 2) @title: 'Actual Usage';
    chargedBlocks : Decimal(20, 2) @title: 'Charged Blocks';
}

// API Interface from '/reports/v1/monthlyUsage' (https://api.sap.com/api/APIUasReportingService/overview)
aspect AMonthlyUsageResponseObject : TTechnicalMeasure {
    key reportYearMonth     : Integer @title: 'Month';
    key serviceName         : String  @title: 'Service';
    key metricName          : String  @title: 'Metric';
    dataCenter              : String;
    dataCenterName          : String;
    directoryId             : String;
    directoryName           : String;
    globalAccountId         : String;
    globalAccountName       : String;
    measureId               : String;
    plan                    : String;
    planName                : String;
    serviceId               : String;
    subaccountId            : String;
    subaccountName          : String;
    unitPlural              : String;
    unitSingular            : String;
    startIsoDate            : String;
    endIsoDate              : String;
    environmentInstanceId   : String;
    environmentInstanceName : String;
    identityZone            : String;
    instanceId              : String;
    spaceId                 : String;
    spaceName               : String;
    application             : String;
    unit                    : String;
}

// API Interface from '/reports/v1/monthlySubaccountsCost' (https://api.sap.com/api/APIUasReportingService/overview)
aspect AMonthlyCostResponseObject : TCommercialMeasure {
    key reportYearMonth : Integer @title: 'Month';
    key serviceName     : String  @title: 'Service';
    key metricName      : String  @title: 'Metric';
    dataCenter          : String;
    dataCenterName      : String;
    directoryId         : String;
    directoryName       : String;
    globalAccountId     : String;
    globalAccountName   : String;
    measureId           : String;
    plan                : String;
    planName            : String;
    serviceId           : String;
    subaccountId        : String;
    subaccountName      : String;
    unitPlural          : String;
    unitSingular        : String;
    startIsoDate        : String;
    endIsoDate          : String;
    crmSku              : String;
    estimated           : Boolean;
    quota               : Decimal(20, 2);
    currency            : String;
    unit                : String;
}

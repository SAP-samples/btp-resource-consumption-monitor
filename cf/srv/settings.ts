export const Settings = {
    appConfiguration: {
        /**
         * Specifies if the tool is used for multiple global accounts.
         * This setting impacts UI only as it steers some of the tables and facets that are only shown for a multi-GA setup
         */
        multiGlobalAccountMode: false,
        /**
         * For multi-GA setups where currencies are different, the currency needs to be converted in order to create a single cost metric on Customer level.
         * If a cost metric is not in the Target currency, it will be converted according to the mentioned rate.
         * This conversion needs to be set to active:true to work. The rate is expressed in target currency.
         * This conversion is done at the time of storing the data in the database, so changing the rate will only impact future costs, not historic costs
        */
        currencyConversions: {
            active: false,
            target: 'EUR',
            rates: {
                'JPY': 0.0059,    // when 1 JPY = 0.0059 EUR
                'GBP': 1.1710,    // when 1 GBP = 1.1710 EUR
                'CAD': 0.6781,    // when 1 CAD = 0.6781 EUR
                'AUD': 0.6150,    // when 1 AUD = 0.6150 EUR
                'CHF': 1.0319,    // when 1 CHF = 1.0319 EUR
                'USD': 0.9205     // when 1 USD = 0.9205 EUR
            }
        },
        // currencyConversions: {
        //     active: true,
        //     target: 'USD',
        //     rates: {
        //         'AUD': 0.6750,    // when 1 AUD = 0.6750 USD
        //     }
        // },
        /**
         * As spaces do not have a cost aspect, this setting specifies whether the tool should try and distribute costs to the space (and underlying service) level.
         * This setting impacts both UI and logic
         */
        distributeCostsToSpaces: true,
        /**
         * Specifies the 'Customer' object as the tree root element.
         * Format: [ databaseid, label ]
         */
        accountHierarchy: {
            master: ['default', 'All Accounts']
        },
        /**
         * Specifies the threshold for any difference between credit consumption and service usage, before being declared as a over/under discrepancy.
         * The allowed difference is expressed in main/central currency
         */
        billingVerification: {
            allowedDifferenceThreshold: 10
        },
        /**
         * List of services for which a lower level should be created with instanceIds. To disable, provide empty list.
         * Technical metrics will be populated by default, commercial metrics will only be populated if Technical Allocation has been configured for the service.
         * 
         * Not all BTP Services have the concept of 'instances', e.g. SAP Integration Suite or SAP Work Zone are not 'instances' because they are 'subscriptions' where there is only 1 per sub account.
         */
        serviceInstancesCreationList: [
            'abap',
            'build-code',
            'adobeforms',
            'data-analytics', // SAP Datasphere
            'data-attribute-recommendation',
            'data-intelligence',
            'document-information-extraction',
            'documentservice',
            'enterprisemessaging',
            'hana-base', // SAP HANA on SAP DC
            'hana-cloud', // SAP HANA Cloud
            'integration-suite-advanced-event-mesh',
            'iot',
            'jobscheduler',
            'linux-container', // Cloud Foundry Runtime
            'mobileservices',
            'objectstore',
            'postgresql-db',
            'sap-analytics-cloud-embedded-edition',
            'sap-build-apps',
            'translationhub'
        ]
    },
    defaultValues: {
        /**
         * When the application is deployed to BTP and start for the first time, mutiple jobs will be created.
         * One of these jobs is used to query the history consumption. This parameter specifies from which month to query the history.
         * In the application a user can still load additional data.
         * 
         * Format: YYYMM
         */
        initialHistoryLoadMonth: 202310,
        /**
         * For newly retrieved Services, or when Forecast Settings are reset, this default values are used
         */
        forecastSetting: {
            method: 'TimeDegressive',
            degressionFactor: 0.75
        },
        noNameErrorValue: 'ERR - no value',
        alert: {
            name: 'New Alert',
            alertType: 'Commercial',
            levelScope: 'Global Account',
            levelMode: 'Exclude',
            levelItems: [],
            serviceScope: 'Service',
            serviceMode: 'Exclude',
            serviceItems: []
        },
        notification: {
            eventType: 'BTPResourceConsumptionWarning',
            resource: {
                resourceName: 'BTPResourceConsumption',
                resourceType: 'application'
            },
            severity: 'WARNING',
            category: 'ALERT',
            subject: 'BTP Resource Consumption notification',
            body: null
        }
    },
    alertTableColumns: {
        Commercial: [
            {
                title: 'Hierarchy',
                width: 20,
                value: 'name'
            },
            {
                title: 'Service',
                width: 20,
                value: 'serviceName'
            },
            {
                title: 'Metric',
                width: 20,
                value: 'metricName'
            },
            {
                title: 'CUR',
                width: 3,
                value: 'currency',
                padStart: true
            },
            {
                title: 'Actual Cost',
                width: 11,
                value: 'measure_cost',
                padStart: true
            },
            {
                title: 'Increase',
                width: 11,
                value: 'delta_measure_cost',
                padStart: true
            },
            {
                title: 'Increase %',
                width: 10,
                value: 'delta_measure_costPct',
                padStart: true
            },
            {
                title: 'Forecasted Cost',
                width: 15,
                value: 'forecast_cost',
                padStart: true
            },
            {
                title: 'Forecast %',
                width: 10,
                value: 'forecastPct',
                padStart: true
            }
        ],
        Technical: [
            {
                title: 'Hierarchy',
                width: 20,
                value: 'name'
            },
            {
                title: 'Service',
                width: 20,
                value: 'serviceName'
            },
            {
                title: 'Metric',
                width: 20,
                value: 'metricName'
            },
            {
                title: 'Actual Usage',
                width: 20,
                value: 'measure_usage',
                padStart: true
            },
            {
                title: 'Increase',
                width: 11,
                value: 'delta_measure_usage',
                padStart: true
            },
            {
                title: 'Increase %',
                width: 10,
                value: 'delta_measure_usagePct',
                padStart: true
            },
            {
                title: 'Unit',
                width: 20,
                value: 'unit'
            }
        ]
    },
    tagConfiguration: {
        // specifies the level on which to create the default tags, if any. Value should be from 'TAccountStructureLevels'
        defaultTagLevel: 'Sub Account',
        defaultTags: [], // To remove default tags
        // defaultTags: [
        //     { name: 'Line of Business', value: 'HR', pct: 35 },
        //     { name: 'Line of Business', value: 'Finance', pct: 20 },
        //     { name: 'Line of Business', value: 'Sales', pct: 45 },
        //     { name: 'Cost Center', value: '100800', pct: 100 }
        // ],
        // specifies the tags in the individual columns shown on the Manage Tags application. Acts as a filter for tag name
        mappings: {
            managedTag0: 'Line of Business',
            managedTag1: 'Cost Center',
            managedTag2: 'not defined',
            managedTag3: 'not defined',
            managedTag4: 'not defined',
            managedTag5: 'not defined',
            managedTag6: 'not defined',
            managedTag7: 'not defined',
            managedTag8: 'not defined',
            managedTag9: 'not defined'
        }
    }
}
export const Settings = {
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
            levelScope: 'GlobalAccount',
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
                value: 'toMetric_toService_serviceName'
            },
            {
                title: 'Metric',
                width: 20,
                value: 'toMetric_metricName'
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
                value: 'toMetric_toService_serviceName'
            },
            {
                title: 'Metric',
                width: 20,
                value: 'toMetric_metricName'
            },
            {
                title: 'Actual Usage',
                width: 20,
                value: 'measure_usage',
                padStart: true
            },
            {
                title: 'Unit',
                width: 20,
                value: 'unit'
            }
        ]
    }
}
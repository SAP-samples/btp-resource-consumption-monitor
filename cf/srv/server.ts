import cds from '@sap/cds'
import { Settings } from './settings'
import { getAllDestinationsFromDestinationService } from '@sap-cloud-sdk/connectivity'
import { DestinationsOnSubaccountLevelApi, Destination } from './external/SAP_CP_CF_Connectivity_Destination'
import { randomUUID as uuidv4 } from 'node:crypto'
import { getServiceDestination } from './functions'
import { filterServices } from '@sap/xsenv'

import {
    JobApi,
    JobSchedulerServiceJobCreate,
    JobSchedulerServiceJob
} from './external/APIJobSchedulerService'
import assert from 'node:assert'

const { info, error } = cds.log('server')

/**
 * Resource usage should be retrieved daily. Jobs will be used to do so.
 * When the application starts, we validate if jobs exists, and if not, create them.
 * If jobs exist (even if inactive or change) they will not be changed.
 */
cds.on('served', async (services) => {
    const api = (await getAllDestinationsFromDestinationService()).find(x => x.name == 'btprc-srv-api')
    if (!api) return error('Application starting too early, probably still waiting for the deployment of destinations. Forcing restart.')
    const host = api!.url ?? 'http://dummy'

    //@ts-expect-error
    const servicePath = services.RetrievalService.path
    info(`Host and path of service: ${host}, ${servicePath}`)

    const urlDaily = `${host}${servicePath}/downloadMeasuresForToday()`
    const urlHistoric = `${host}${servicePath}/downloadMeasuresForPastMonths(fromDate=${Settings.defaultValues.initialHistoryLoadMonth})`
    const urlMonthly = `${host}${servicePath}/downloadMeasuresForPastMonths(fromDate=0)`

    const jobs: JobSchedulerServiceJobCreate[] = [
        {
            jobId: 0,
            active: true,
            name: 'Default_UpdateDailyUsage',
            description: 'Default generated recurring job to update the daily resource usage',
            jobType: 'HTTP_ENDPOINT',
            httpMethod: 'GET',
            action: urlDaily,
            schedules: [{
                description: 'Daily, every 3 hours',
                cron: '* * * * */3 0 0',
                active: true
            },
            {
                description: 'Daily, every 6 hours',
                cron: '* * * * */6 0 0',
                active: false
            },
            {
                description: 'Daily, at 6am UTC',
                cron: '* * * * 6 0 0',
                active: false
            },
            {
                description: 'Initial load',
                time: 'in 2 minutes',
                active: true
            }]
        },
        {
            jobId: 0,
            active: true,
            name: 'Default_UpdateHistoricUsage',
            description: 'Default generated once-off job to update the historic resource usage',
            jobType: 'HTTP_ENDPOINT',
            httpMethod: 'GET',
            action: urlHistoric,
            schedules: [{
                description: 'Initial load',
                time: 'in 1 minute',
                active: true
            }]
        },
        {
            jobId: 0,
            active: true,
            name: 'Default_UpdateMonthlyUsage_v2.0.3', // Name changed to ensure creation of the job when upgrading from previous versions
            description: 'Default generated recurring job to update the past month\'s resource usage',
            jobType: 'HTTP_ENDPOINT',
            httpMethod: 'GET',
            action: urlMonthly,
            schedules: [{
                description: 'Daily, every first 5 days of the month at 00.30am UTC',
                cron: '* * 1:5 * 0 30 0',
                active: true
            }]
        }
    ]

    info(`Validating job schedules (create if not exists)...`)
    api_getJobs()
        .then(existing => {
            const jobNames = (existing.results as JobSchedulerServiceJob[]).map(x => x.name)
            info(`Existing jobs: ${jobNames.join(', ')}`)
            jobs.filter(x => !jobNames.includes(x.name))
                .forEach(job => {
                    api_createJob(job)
                        .then(created => info(`Created job ${job.name} with ID ${created._id}`))
                })
        })

    info(`Creating sample alerts if none exist...`)
    const alerts = await SELECT.from('db_Alerts').columns('ID')
    if (alerts.length == 0) {
        // Alert 1:
        let alertUUID = uuidv4()
        await INSERT.into('db_Alerts').entries([{
            ID: alertUUID,
            // active: 'true',
            name: 'Sample Alert',
            alertType: 'Commercial',
            levelScope: 'Global Account',
            levelMode: 'Exclude',
            serviceScope: 'Service',
            serviceMode: 'Exclude'
        }])
        await INSERT.into('db_AlertThresholds').entries([
            {
                ID: uuidv4(),
                toAlert_ID: alertUUID,
                property: 'forecast_cost',
                operator: '>=',
                amount: 1000
            },
            {
                ID: uuidv4(),
                toAlert_ID: alertUUID,
                property: 'forecastPct',
                operator: '>=',
                amount: 120
            }
        ])
        // Alert 2:
        alertUUID = uuidv4()
        await INSERT.into('db_Alerts').entries([{
            ID: alertUUID,
            // active: 'true',
            name: 'Out-of-credits Charges',
            alertType: 'Commercial',
            levelScope: 'Global Account',
            levelMode: 'Exclude',
            serviceScope: 'Service',
            serviceMode: 'Exclude'
        }])
        await INSERT.into('db_AlertThresholds').entries([
            {
                ID: uuidv4(),
                toAlert_ID: alertUUID,
                property: 'measure_paygCost',
                operator: '>',
                amount: 0
            }
        ])
        info(`Sample alerts created.`)
    } else {
        info(`${alerts.length} alerts exist. No action taken.`)
    }

    await createSubaccountDestinationIfNotExist(host)
})


/**
 * Calls the API to create a Job with Schedule
 * @param job details of the job
 * @returns 
 */
async function api_createJob(job: JobSchedulerServiceJobCreate) {
    const serviceDestination = await getServiceDestination('UAA', 'btprc-scheduler')
    return JobApi
        .createJob(job)
        .execute(serviceDestination)
}

/**
 * Calls the API to retrieve all jobs
 * @returns response object containing the list of jobs in the `results` property
 */
async function api_getJobs() {
    const serviceDestination = await getServiceDestination('UAA', 'btprc-scheduler')
    return JobApi
        .getJobs()
        .execute(serviceDestination)
}

/**
 * Verifies if there is a subaccount-level destination to our application. This is needed for Work Zone.
 * Cloud Foundry deployments will have this created from the MTA deployment, but Kyma deployment will not.
 * For Kyma, there will only be Destination Service Instance destinations, from which we can copy the credentials to create a subaccount destination.
 * @param host Endpoint/URL of the exposed srv application
 */
async function createSubaccountDestinationIfNotExist(host: string) {
    const destinationName = 'btprc-srv'

    const destinationService = filterServices({ label: 'destination' })[0]
    assert(destinationService, `Destination service not bound.`)
    const serviceDestination = await getServiceDestination('Destination', destinationService.name)

    const subaccountDestinations = await DestinationsOnSubaccountLevelApi
        .getSubaccountDestinations({ $filter: `Name in ('${destinationName}')` })
        .execute(serviceDestination)

    if (subaccountDestinations && subaccountDestinations.length == 1) {
        info(`Subaccount destination "${destinationName}" found. Ok, continuing.`)
    } else {
        info(`Subaccount destination "${destinationName}" not found, trying to create...`)
        const xsuaaService = filterServices({ label: 'xsuaa' })[0]
        assert(xsuaaService, `XSUAA service not bound.`)
        const destination: Destination = {
            Type: 'HTTP',
            ProxyType: 'Internet',
            Name: destinationName,
            URL: host,
            Description: 'BTP Resource Consumption endpoint for Work Zone',
            Authentication: 'OAuth2UserTokenExchange',
            tokenServiceURL: `${xsuaaService.credentials.url}/oauth/token`,
            tokenServiceURLType: 'Dedicated',
            clientId: xsuaaService.credentials.clientid,
            clientSecret: xsuaaService.credentials.clientsecret,
            'HTML5.DynamicDestination': true,
            'sap.cloud.service': 'sap.btp.resourceconsumption'
        }
        await DestinationsOnSubaccountLevelApi
            .createSubaccountDestinations(destination)
            .execute(serviceDestination)
        info(`Subaccount destination "${destinationName}" created:`, destination)
    }
}

export default cds.server

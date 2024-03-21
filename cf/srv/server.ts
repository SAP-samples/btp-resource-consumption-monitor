import cds from '@sap/cds'
import { Settings } from './settings'
import { getAllDestinationsFromDestinationService } from '@sap-cloud-sdk/connectivity'
import { v4 as uuidv4 } from 'uuid'

import {
    JobApi,
    JobSchedulerServiceJobCreate,
    JobSchedulerServiceJob
} from './external/APIJobSchedulerService'

const info = cds.log('server').info

/**
 * Resource usage should be retrieved daily. Jobs will be used to do so.
 * When the application starts, we validate if jobs exists, and if not, create them.
 * If jobs exist (even if inactive or change) they will not be changed.
 */
cds.on('served', async (services) => {
    const host =
        (await getAllDestinationsFromDestinationService()).find(x => x.name == 'btprc-srv-api')?.url
        ?? 'http://dummy'
    //@ts-ignore
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
            description: 'Default generated recurring job to update the daily resource usage using the CPEA Spike Alert application',
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
                time: 'in 10 seconds',
                active: true
            }]
        },
        {
            jobId: 0,
            active: true,
            name: 'Default_UpdateHistoricUsage',
            description: 'Default generated once-off job to update the historic resource usage using the CPEA Spike Alert application',
            jobType: 'HTTP_ENDPOINT',
            httpMethod: 'GET',
            action: urlHistoric,
            schedules: [{
                description: 'Initial load',
                time: 'in 5 seconds',
                active: true
            }]
        },
        {
            jobId: 0,
            active: true,
            name: 'Default_UpdateMonthlyUsage',
            description: 'Default generated recurring job to update the past month\'s resource usage using the CPEA Spike Alert application',
            jobType: 'HTTP_ENDPOINT',
            httpMethod: 'GET',
            action: urlMonthly,
            schedules: [{
                description: 'Monthly, Every 1st day at 1am and 3am UTC',
                cron: '* * 1 * 1,3 0 0',
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

    info(`Creating sample alert if none exist...`)
    const alerts = await SELECT.from('db_Alerts').columns('ID')
    if (alerts.length == 0) {
        const alertUUID = uuidv4()
        await INSERT.into('db_Alerts').entries([{
            ID: alertUUID,
            // active: 'true',
            name: 'Sample Alert',
            alertType: 'Commercial',
            levelScope: 'GlobalAccount',
            levelMode: 'Exclude',
            levelItems: '[]',
            serviceScope: 'Service',
            serviceMode: 'Exclude',
            serviceItems: '[]',
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
        info(`Sample Alert created.`)
    } else {
        info(`${alerts.length} alerts exist. No action taken.`)
    }
})


/**
 * Calls the API to create a Job with Schedule
 * @param job details of the job
 * @returns 
 */
function api_createJob(job: JobSchedulerServiceJobCreate) {
    return JobApi
        .createJob(job)
        .execute({ destinationName: 'btprc-scheduler' })
}

/**
 * Calls the API to retrieve all jobs
 * @returns response object containing the list of jobs in the `results` property
 */
function api_getJobs() {
    return JobApi
        .getJobs()
        .execute({ destinationName: 'btprc-scheduler' })
}

export default cds.server

import cds from '@sap/cds'
import { Settings } from './settings'
import { flattenObject } from './functions'
import { getUserAccessContext, addInFilter } from './authorizationHelper'

import {
    Alert,
    Alerts
} from '#cds-models/ManageAlertsService'

import RetrievalService from '#cds-models/RetrievalService'

const info = cds.log('manageAlertsService').info

export default class ManageAlertsService extends cds.ApplicationService {
    async init() {

        // Connect to Retrieval Service to send triggers
        const retrievalService = await cds.connect.to(RetrievalService)

        /**
         * Authorization: Filter LevelNames by user access
         * LevelNames is a projection on AccountStructureItems
         */
        this.before('READ', 'LevelNames', async req => {
            const context = await getUserAccessContext(req)
            if (!context.isUnrestricted) {
                if (context.allowedIds.length === 0) {
                    addInFilter(req.query, 'id', ['__NO_ACCESS__'])
                } else {
                    addInFilter(req.query, 'id', context.allowedIds)
                }
                info(`Authorization: Filtering LevelNames to ${context.allowedIds.length} accessible IDs`)
            }
        })

        this.on('READ', Alert, async (req, next) => {
            const columns = req.query.SELECT?.columns?.map(x => x.ref ? x.ref[0] : '')
            const requestedSimulation = columns?.find(x => x.toString().startsWith('simulation_'))
            const alert = await next() as Alert
            return requestedSimulation && alert.ID
                ? addSimulation(alert, false)
                : alert
        })
        this.on('READ', Alerts.drafts, async (req, next) => {
            const columns = req.query.SELECT?.columns?.map(x => x.ref ? x.ref[0] : '')
            const requestedSimulation = columns?.find(x => x.toString().startsWith('simulation_'))
            const alert = await next() as Alert
            return requestedSimulation && alert.ID
                ? addSimulation(alert, true)
                : alert
        })
        async function addSimulation(alert: Alert, useDrafts: boolean) {
            if (alert.ID) {
                info('Running simulation ...')
                const simulation = await retrievalService.testAlert(alert.ID, useDrafts)
                if (simulation)
                    try {
                        simulation.json = `<pre><code>${prettyPrintJSON(JSON.parse(simulation.json ?? `{error:'Could not parse JSON'}`))}</code></pre>`
                    } catch (error) {
                        simulation.json = `<pre><code>${simulation.json ?? String(error)}</code></pre>`
                    }
                Object.assign(alert, flattenObject({ simulation }))
                info('done')
            }
            return alert
        }

        this.on(Alert.actions.getDefaultValues, async req => {
            return await this.send({
                //@ts-expect-error
                query: INSERT.into(Alerts).entries([Settings.defaultValues.alert]),
                event: "NEW"
            })
        })

        return super.init()
    }
}

function prettyPrintJSON(json: string) {
    const jsonLine = /^( *)("[\w]+": )?("[^"]*"|[\w.+-]*)?([,[{])?$/mg
    return JSON.stringify(json, null, 3)
        .replace(/&/g, '&amp;')
        .replace(/\\"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(jsonLine, replacer)
}
function replacer(match: string, pIndent: string, pKey: string, pVal: string, pEnd: string) {
    const key = '<span class=json-key>'
    const val = '<span class=json-value>'
    const str = '<span class=json-string>'
    var r = pIndent || ''
    if (pKey)
        r = r + key + pKey.replace(/[": ]/g, '') + '</span>: '
    if (pVal)
        r = r + (pVal[0] == '"' ? str : val) + pVal + '</span>'
    return r + (pEnd || '')
}

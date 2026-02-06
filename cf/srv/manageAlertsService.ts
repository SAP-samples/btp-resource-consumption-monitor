import cds from '@sap/cds'
import { Settings } from './settings'
import { flattenObject } from './functions'
import {
    createBasicIdFilter,
    createNoAccessGuard,
    createChildItemsValidator,
    createDeleteProtection,
    createCustomReadFilter,
    getAccessibleServiceIds,
    getAccessibleAlertIds,
    getAccessibleMetricIds
} from './authorizationHelper'

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

        // ====================================================================
        // AUTHORIZATION HANDLERS
        // ====================================================================

        // Basic ID filtering for LevelNames
        this.before('READ', 'LevelNames', createBasicIdFilter('id'))

        // Complex alert filtering (user can see alerts targeting their accounts OR created by them)
        this.before('READ', Alerts, createCustomReadFilter(
            'ID',
            async (ctx, req) => getAccessibleAlertIds(ctx.allowedIds, req.user?.id || ''),
            'Alerts'
        ))

        // Validate viewer has at least some account access for create/update
        this.before(['CREATE', 'UPDATE'], Alerts, createNoAccessGuard('You do not have access to any accounts to create alerts for'))

        // Validate levelItems are within viewer's access on draft activation
        this.before('SAVE', Alerts, createChildItemsValidator(
            data => (data as Alert).levelItems,
            item => item.itemID!,
            'alerts'
        ))

        // Prevent viewers from deleting alerts outside their scope
        this.before('DELETE', Alerts, createDeleteProtection(
            data => data.ID as string | undefined,
            async (ctx, req) => getAccessibleAlertIds(ctx.allowedIds, req.user?.id || ''),
            'alert'
        ))

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

        // Filter ServiceAndMetricNames by user access
        this.before('READ', 'ServiceAndMetricNames', createCustomReadFilter(
            'id',
            async (ctx) => {
                const serviceIds = await getAccessibleServiceIds(ctx.allowedIds)
                if (serviceIds.length === 0) return []
                const metricIds = await getAccessibleMetricIds(ctx.allowedIds)
                return [...serviceIds.map(id => `service_${id}`), ...metricIds]
            },
            'ServiceAndMetricNames'
        ))

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


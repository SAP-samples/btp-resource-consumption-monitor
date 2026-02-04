import cds from '@sap/cds'
import { Settings } from './settings'
import { flattenObject } from './functions'
import {
    getUserAccessContext,
    addInFilter,
    createBasicIdFilter,
    getAccessibleServiceIds,
    NO_ACCESS_VALUE
} from './authorizationHelper'

import {
    Alert,
    Alerts
} from '#cds-models/ManageAlertsService'

import { AlertLevelItems, Alerts as DBAlerts } from '#cds-models/db'

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
        this.before('READ', Alerts, async req => {
            const context = await getUserAccessContext(req)
            if (!context.isUnrestricted) {
                const userId = req.user?.id || ''
                const accessibleAlertIds = await getAccessibleAlertIds(context.allowedIds, userId)
                addInFilter(req.query, 'ID', accessibleAlertIds.length > 0 ? accessibleAlertIds : [NO_ACCESS_VALUE])
                info(`Authorization: Filtering Alerts for viewer ${userId} with ${context.allowedIds.length} accessible account IDs`)
            }
        })

        // Validate viewer has at least some account access for create/update
        this.before(['CREATE', 'UPDATE'], Alerts, async req => {
            const context = await getUserAccessContext(req)
            if (!context.isUnrestricted && context.allowedIds.length === 0) {
                req.reject(403, 'You do not have access to any accounts to create alerts for')
            }
        })

        // Validate levelItems are within viewer's access on draft activation
        this.before('SAVE', Alerts, async req => {
            const context = await getUserAccessContext(req)
            if (!context.isUnrestricted && req.data) {
                const alertData = req.data as Alert
                if (alertData.levelItems && alertData.levelItems.length > 0) {
                    const invalidItems = alertData.levelItems.filter(
                        item => !context.allowedIds.includes(item.itemID!)
                    )
                    if (invalidItems.length > 0) {
                        req.reject(403, `You cannot create alerts for accounts you do not have access to: ${invalidItems.map(i => i.itemID).join(', ')}`)
                    }
                }
            }
        })

        // Prevent viewers from deleting alerts outside their scope
        this.before('DELETE', Alerts, async req => {
            const context = await getUserAccessContext(req)
            if (!context.isUnrestricted) {
                const alertId = (req.data as Alert).ID
                if (alertId) {
                    const userId = req.user?.id || ''
                    const accessibleAlertIds = await getAccessibleAlertIds(context.allowedIds, userId)
                    if (!accessibleAlertIds.includes(alertId)) {
                        req.reject(403, 'You do not have permission to delete this alert')
                    }
                }
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

        // Filter ServiceAndMetricNames by user access
        this.before('READ', 'ServiceAndMetricNames', async req => {
            const context = await getUserAccessContext(req)
            if (!context.isUnrestricted) {
                if (context.allowedIds.length === 0) {
                    addInFilter(req.query, 'id', [NO_ACCESS_VALUE])
                } else {
                    const accessibleServiceIds = await getAccessibleServiceIds(context.allowedIds)
                    if (accessibleServiceIds.length === 0) {
                        addInFilter(req.query, 'id', [NO_ACCESS_VALUE])
                    } else {
                        // Build list of allowed IDs (service_<id>, cmetric_<id>, tmetric_<id>)
                        const allowedIds = accessibleServiceIds.map(id => `service_${id}`)
                        const accessibleMetricIds = await getAccessibleMetricIds(context.allowedIds)
                        allowedIds.push(...accessibleMetricIds)
                        addInFilter(req.query, 'id', allowedIds)
                    }
                }
            }
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

/**
 * Gets the list of Alert IDs that the viewer has access to.
 * A viewer can see alerts that:
 * 1. Target accounts in their allowedIds (subaccounts they have access to)
 * 2. Were created by the viewer themselves (based on createdBy field)
 *
 * @param allowedIds - Array of accessible AccountStructureItem IDs
 * @param userId - The current user's ID to check for alerts they created
 * @returns Array of Alert IDs that the viewer has access to
 */
async function getAccessibleAlertIds(allowedIds: string[], userId: string): Promise<string[]> {
    const alertIdSet = new Set<string>()

    // 1. Get alerts that target the viewer's accessible subaccounts
    if (allowedIds.length > 0) {
        const alertLevelItems = await SELECT.distinct
            .from(AlertLevelItems)
            .columns('toAlert_ID')
            .where({ itemID: { in: allowedIds } })

        for (const item of alertLevelItems) {
            if (typeof item.toAlert_ID === 'string' && item.toAlert_ID.length > 0) {
                alertIdSet.add(item.toAlert_ID)
            }
        }
    }

    // 2. Get alerts created by the viewer themselves
    if (userId) {
        const userAlerts = await SELECT.distinct
            .from(DBAlerts)
            .columns('ID')
            .where({ createdBy: userId })

        for (const alert of userAlerts) {
            if (typeof alert.ID === 'string' && alert.ID.length > 0) {
                alertIdSet.add(alert.ID)
            }
        }
    }

    return Array.from(alertIdSet)
}

/**
 * Gets the list of metric IDs (in ServiceAndMetricNames format) that the viewer has access to.
 * Format: 'cmetric_<measureId>' for commercial metrics, 'tmetric_<measureId>' for technical metrics
 *
 * @param allowedIds - Array of accessible AccountStructureItem IDs
 * @returns Array of metric IDs in the format used by ServiceAndMetricNames
 */
async function getAccessibleMetricIds(allowedIds: string[]): Promise<string[]> {
    if (allowedIds.length === 0) {
        return []
    }

    // Query CommercialMeasures to find distinct metric IDs that have measures in accessible accounts
    const commercialMetrics = await SELECT.distinct
        .from('db.CommercialMeasures')
        .columns('toMetric.measureId as measureId')
        .where({ id: { in: allowedIds } })

    const commercialIds = commercialMetrics
        .map((m: { measureId: string }) => `cmetric_${m.measureId}`)
        .filter((id: string) => !id.endsWith('_combined_'))

    // Query TechnicalMeasures to find distinct metric IDs that have measures in accessible accounts
    const technicalMetrics = await SELECT.distinct
        .from('db.TechnicalMeasures')
        .columns('toMetric.measureId as measureId')
        .where({ id: { in: allowedIds } })

    const technicalIds = technicalMetrics
        .map((m: { measureId: string }) => `tmetric_${m.measureId}`)
        .filter((id: string) => !id.endsWith('_combined_'))

    return [...commercialIds, ...technicalIds]
}

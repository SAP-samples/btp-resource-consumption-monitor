import cds from '@sap/cds'
import { Settings } from './settings'
import { addRequiredColumns } from './functions'

import {
    Alert,
    Alerts
} from '#cds-models/ManageAlertsService'

import { testAlert } from '#cds-models/RetrievalService'

const info = cds.log('manageAlertsService').info

export default class ManageAlertsService extends cds.ApplicationService {
    async init() {

        // Connect to Retrieval Service to send triggers
        const retrievalService = await cds.connect.to('RetrievalService')

        /**
         * Handlers for Alerts
         */
        this.before('READ', Alerts, req => beforeHandler(req))
        this.after('READ', Alerts, items => afterHandler(items))
        this.before('READ', Alerts.drafts, req => beforeHandler(req))
        this.after('READ', Alerts.drafts, items => afterHandler(items as Alerts))

        function beforeHandler(req: cds.Request) {
            addRequiredColumns<Alert>(req.query, ['levelItems'])
            addRequiredColumns<Alert>(req.query, ['serviceItems'])
        }
        function afterHandler(items?: Alerts) {
            items?.forEach(each => {
                each.levelItemsText = each.levelItems?.join(', ')
                each.serviceItemsText = each.serviceItems?.join(', ')
            })
        }

        /**
         * Handlers for Actions
         */
        this.on(Alert.actions.setLevelItems, async req => {
            const { items } = req.data
            await UPDATE(req.subject).with({ levelItems: items })
        })
        this.on(Alert.actions.setServiceItems, async req => {
            const { items } = req.data
            await UPDATE(req.subject).with({ serviceItems: items })
        })

        this.on(Alert.actions.getDefaultValues, async req => {
            return await this.send({
                //@ts-ignore
                query: INSERT.into(Alerts).entries([Settings.defaultValues.alert]),
                event: "NEW",
            })
        })

        this.on(Alert.actions.testAlert, async req => {
            //@ts-ignore
            const ID = req.params[0].ID
            const items = await retrievalService.send(testAlert.toString(), { ID })
            return req.info(items)
        })

        return super.init()
    }
}

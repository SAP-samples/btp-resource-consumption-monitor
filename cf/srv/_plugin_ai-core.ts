import cds from '@sap/cds'
import PresentationService from './presentationService'

import { ModelDataPoints } from '#cds-models/PresentationService'

const { info, warn, error } = cds.log('plugin_AICore')

export default class Plugin_AICore extends cds.ApplicationService {
    async init() {

        const presentationService = await cds.connect.to(PresentationService)
        presentationService.after('READ', ModelDataPoints, (items, req) => {
            items?.forEach(item => {
                item.modelName = rewriteModelName(item.modelName ?? '')
            })
        })

        return super.init()
    }
}

/**
 * Model names tend to be in the format `vendor--name-version` but this format is not strictly enforced.
 * @param modelName name of the model
 */
function rewriteModelName(modelName: string): string {

    // Example: anthropic--claude-3-haiku-1
    if (modelName.includes('--')) {
        const [vendor, model] = modelName.split('--', 2)
        return `${capitalize(vendor)}: ${capitalize(model).replaceAll('-', ' ')}`
    }

    // Example: gemini-1.5-pro-002-128k
    if (modelName.includes('-')) {
        return `${capitalize(modelName).replaceAll('-', ' ')}`
    }

    return capitalize(modelName)
}

function capitalize(text: string): string {
    return `${text.charAt(0).toUpperCase()}${text.slice(1)}`
}
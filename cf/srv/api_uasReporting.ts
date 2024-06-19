import cds from '@sap/cds'
import assert from 'assert'
import {
    CloudCreditsDetailsResponseObject,
    MonthlyCostResponseList,
    MonthlyUsageResponseList,
    UsageAndCostManagementApi
} from './external/APIUasReportingService'
import {
    getDestinationFromServiceBinding,
    serviceToken,
    decodeJwt,
    HttpDestination
} from '@sap-cloud-sdk/connectivity'

const info = cds.log('UAS API').info

/**
 * Call the UAS API to get the usage data
 * @param queryParameters
 * @returns Monthly usage data
 */
// export async function api_monthlyUsage(queryParameters: { fromDate: number, toDate: number }) {
//     const serviceDestination = await getServiceDestination()
//     return await UsageAndCostManagementApi
//         .monthlyUsage(queryParameters)
//         .execute(serviceDestination)
// }
export async function api_monthlyUsage(queryParameters: { fromDate: number, toDate: number }) {
    let data: MonthlyUsageResponseList = { content: [] }
    for (const binding of serviceBindingNames) {
        info(`Querying binding ${binding}...`)
        const serviceDestination = await getServiceDestination(binding)
        const result = await UsageAndCostManagementApi
            .monthlyUsage(queryParameters)
            .execute(serviceDestination)
        data.content = data.content.concat(result.content)
    }
    return data
}
// export async function api_monthlyCost(queryParameters: { fromDate: number, toDate: number }) {
//     const serviceDestination = await getServiceDestination()
//     return await UsageAndCostManagementApi
//         .monthlyUsageSubaccountCost(queryParameters)
//         .execute(serviceDestination)
// }
export async function api_monthlyCost(queryParameters: { fromDate: number, toDate: number }) {
    let data: MonthlyCostResponseList = { content: [] }
    for (const binding of serviceBindingNames) {
        info(`Querying binding ${binding}...`)
        const serviceDestination = await getServiceDestination(binding)
        const result = await UsageAndCostManagementApi
            .monthlyUsageSubaccountCost(queryParameters)
            .execute(serviceDestination)
        data.content = data.content.concat(result.content)
    }
    return data
}
// export async function api_creditDetails(queryParameters: { viewPhases: 'ALL' | 'CURRENT' }) {
//     const serviceDestination = await getServiceDestination()
//     return await UsageAndCostManagementApi
//         .cloudCreditsDetails(queryParameters)
//         .execute(serviceDestination)
// }
export async function api_creditDetails(queryParameters: { viewPhases: 'ALL' | 'CURRENT' }) {
    let data: CloudCreditsDetailsResponseObject[] = []
    for (const binding of serviceBindingNames) {
        info(`Querying binding ${binding}...`)
        const serviceDestination = await getServiceDestination(binding)
        const result = await UsageAndCostManagementApi
            .cloudCreditsDetails(queryParameters)
            .execute(serviceDestination)
        data = data.concat(result)
    }
    return data
}

/**
 * Retrieves destination configuration with renewed token
 * @returns HTTPDestination
*/
async function getServiceDestination(ServiceBindingName: string) {
    return await getDestinationFromServiceBinding({
        destinationName: ServiceBindingName,
        serviceBindingTransformFn: async (service, options) => {
            const token = await serviceToken(service, options)
            const exp = decodeJwt(token).exp
            return {
                url: service.credentials.target_url,
                authentication: 'OAuth2ClientCredentials',
                authTokens: [{
                    value: token,
                    type: 'bearer',
                    expiresIn: exp && Math.floor((exp * 1000 - Date.now()) / 1000).toString(10) || '0',
                    http_header: { key: 'Authorization', value: `Bearer ${token}` },
                    error: null
                }]
            }
        }
    }) as HttpDestination
}

/**
 * Startup validation of required bindings
*/
let serviceBindingNames: string[] = []
const config: Record<string, Record<string, string>[]> = JSON.parse(process.env.VCAP_SERVICES ?? '{}');
Object.keys(config).forEach(binding => {
    if (config[binding]?.length > 0) {
        serviceBindingNames = serviceBindingNames.concat(
            config[binding]
                .map(x => x.name)
                .filter(x => x.match(/.*(btprc\-uas).*/))
        )
    }
})
assert(serviceBindingNames.length > 0, `No service instance of type UAS has been bound to the application`)
info(`Connected to ${serviceBindingNames.length} UAS instances: ${serviceBindingNames.join(', ')}`)

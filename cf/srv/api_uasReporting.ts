import assert from 'assert'
import { UsageAndCostManagementApi } from './external/APIUasReportingService'
import {
    getDestinationFromServiceBinding,
    serviceToken,
    decodeJwt,
    HttpDestination
} from '@sap-cloud-sdk/connectivity'

/**
 * Call the UAS API to get the usage data
 * @param queryParameters
 * @returns Monthly usage data
 */
export async function api_monthlyUsage(queryParameters: { fromDate: number, toDate: number }) {
    const serviceDestination = await getServiceDestination()
    return await UsageAndCostManagementApi
        .monthlyUsage(queryParameters)
        .execute(serviceDestination)
}
export async function api_monthlyCost(queryParameters: { fromDate: number, toDate: number }) {
    const serviceDestination = await getServiceDestination()
    return await UsageAndCostManagementApi
        .monthlyUsageSubaccountCost(queryParameters)
        .execute(serviceDestination)
}

/**
 * Retrieves destination configuration with renewed token
 * @returns HTTPDestination
*/
async function getServiceDestination() {
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
const service = 'uas'
const config = process.env.VCAP_SERVICES
    && JSON.parse(process.env.VCAP_SERVICES)[service] // use the normal service binding
    || JSON.parse(process.env.VCAP_SERVICES ?? '{}')['user-provided'] // fallback: use a User Provided Service for other-Global Account service instances
const ServiceBindingName: string = config?.length > 0 ? config[0].name : undefined
assert(ServiceBindingName, `No service instance of type ${service} has been bound to the application`)

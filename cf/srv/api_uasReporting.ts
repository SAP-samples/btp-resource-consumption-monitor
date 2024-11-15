import cds from '@sap/cds'
import assert from 'assert'
import {
    CloudCreditsDetailsResponseObject,
    MonthlyCostResponseList,
    MonthlyUsageResponseList,
    UsageAndCostManagementApi
} from './external/APIUasReportingService'

import { getServiceDestination } from './functions'
import { filterServices } from '@sap/xsenv'

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
        try {
            const serviceDestination = await getServiceDestination('TargetUrl', binding)
            const result = await UsageAndCostManagementApi
                .monthlyUsage(queryParameters)
                .execute(serviceDestination)
            data.content = data.content.concat(result.content)
        }
        catch (e) { throw new Error(`[${binding}] ${String(e)}`) }
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
        try {
            const serviceDestination = await getServiceDestination('TargetUrl', binding)
            const result = await UsageAndCostManagementApi
                .monthlyUsageSubaccountCost(queryParameters)
                .execute(serviceDestination)
            data.content = data.content.concat(result.content)
        }
        catch (e) { throw new Error(`[${binding}] ${String(e)}`) }
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
        try {
            const serviceDestination = await getServiceDestination('TargetUrl', binding)
            const result = await UsageAndCostManagementApi
                .cloudCreditsDetails(queryParameters)
                .execute(serviceDestination)
            data = data.concat(result)
        }
        catch (e) { throw new Error(`[${binding}] ${String(e)}`) }
    }
    return data
}

/**
 * Startup validation of required bindings
*/
const serviceBindingNames = filterServices(binding => /.*(uas).*/.test(binding.name)).map(x => x.name)
assert(serviceBindingNames.length > 0, `No service instance of type UAS has been bound to the application`)
info(`Connected to ${serviceBindingNames.length} UAS instances: ${serviceBindingNames.join(', ')}`)

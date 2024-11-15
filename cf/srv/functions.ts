import cds from '@sap/cds'
import { TTag } from '#cds-models/types'
import { CdsDate } from '#cds-models/_'
import { Settings } from './settings'
import {
    CustomTags,
    ManagedTagAllocations
} from '#cds-models/db'

import {
    getDestinationFromServiceBinding,
    serviceToken,
    decodeJwt,
    HttpDestination,
    Service,
    ServiceBindingTransformOptions,
    DestinationAuthToken
} from '@sap-cloud-sdk/connectivity'

const info = cds.log('functions').info

export function fixDecimals(n: number | string | undefined, scale: number = 2): number {
    if (typeof n == 'number') return Number(n.toFixed(scale))
    if (typeof n == 'string') return Number(Number(n).toFixed(scale))
    return 0
}

export function dateToYearMonth(date?: Date): string {
    return (date ? date : new Date())
        .toISOString()
        .split('T')[0]
        .split('-')
        .slice(0, 2)
        .join('')
}

export function getDaysInMonth(date?: Date): number {
    const d = date ? date : new Date()
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
}

/**
 * 
 * @param dateYearMonth 202402
 * @returns 2024-02-29
 */
export function lastDayOfMonth(dateYearMonth: string) {
    const [y, m] = [
        dateYearMonth.substring(0, 4),
        dateYearMonth.substring(4, 6)
    ]
    const d = new Date(Number(y), Number(m), 0).getDate()
    return [y, m, d].join('-') as CdsDate
}

export function dateToISODate(date?: Date): string {
    return (date ? date : new Date()).toISOString().split('T')[0]
}
export function stringToCdsDate(date: string): CdsDate {
    return dateToISODate(new Date(date)) as CdsDate
}

export function getPreviousMonth(date?: Date): number {
    const thisMonth = dateToYearMonth(date)
    return thisMonth.endsWith('01') ? Number(thisMonth) - 1 - 88 : Number(thisMonth) - 1
}
export function getNextMonth(yearMonth: string): number {
    return yearMonth.endsWith('12') ? Number(yearMonth) + 1 + 88 : Number(yearMonth) + 1
}

export function groupByKeys<T>(items: T[], keys: (keyof T)[]): { [key: string]: T[] } {
    return items.reduce((p, c) => {
        const id = JSON.stringify(keys.map(x => c[x] || Settings.defaultValues.noNameErrorValue))
        p[id] = p[id] || []
        p[id].push(c)
        return p
    }, {} as { [key: string]: T[] })
}

export function flattenObject(object: Record<string, any> | null, parent?: string) {
    const flattened: Record<string, any> = {}
    for (const [k, v] of Object.entries(object ?? {})) {
        if (typeof v === 'object' && !Array.isArray(v) && v !== null) {
            Object.assign(flattened, flattenObject(v, parent ? `${parent}_${k}` : k))
        } else {
            flattened[parent ? `${parent}_${k}` : k] = v
        }
    }
    return flattened
}

export function addRequiredColumns<T>(query: Partial<cds.SELECT>, requiredColumns: (keyof T)[], verifyColumn?: (keyof T)): void {
    const refColumns = query.SELECT?.columns
    if (refColumns) {
        const isRequested = verifyColumn ? doesRequireColumn(query, verifyColumn) : true
        if (isRequested) {
            for (const requiredColumn of requiredColumns) {
                if (!refColumns.find(c => c.ref && c.ref.find(x => x == requiredColumn))) {
                    refColumns.push({ ref: [requiredColumn as string] })
                    info(`!! Added column ${requiredColumn.toString()} manually to query`)
                }
            }
        }
    }
}

function doesRequireColumn<T>(query: Partial<cds.SELECT>, verifyColumn: (keyof T)): boolean {
    const refColumns = query.SELECT?.columns
    if (refColumns) {
        return refColumns.find(c => (typeof c == 'string') || (c.ref && c.ref.find(x => x == verifyColumn))) !== undefined
    } else
        return false
}

export function formatTags(tags: TTag[]) {
    const bullet = '   - '
    const line = '\r\n'
    return tags
        .map(n => `${n.name?.toUpperCase()}:${line}${bullet}${n.values?.join(line + bullet)}`)
        .join(line + line)
}

// export function increaseMonth(dateYearMonth: string) {
//     return (
//         dateYearMonth.endsWith('12') ?
//             Number(dateYearMonth) + 88 + 1
//             : Number(dateYearMonth) + 1
//     ).toString()
// }

export function isInRange(date: string, start?: string, end?: string) {
    let inRange: boolean = true
    const dDate = date && new Date(date)
    if (start) inRange &&= new Date(start) <= dDate
    if (end) inRange &&= new Date(end) >= dDate
    return inRange
}

export function stringifyTagAllocations(items?: ManagedTagAllocations) {
    return items && items
        .sort((a, b) => { return (a.pct ?? 0) < (b.pct ?? 0) ? 1 : -1 })
        .map(x => `${x.value} (${x.pct}%)`)
        .join(', ')
}
export function stringifyCustomTags(items?: CustomTags) {
    return items && items
        .map(x => `${x.name} (${x.value})`)
        .join(', ')
}

export function reportYearMonthToText(reportYearMonth: string): string {
    const months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December'
    ]
    const month = Number(reportYearMonth.slice(4, 6)) - 1
    return month < months.length ? (`${months[month]} ${reportYearMonth.slice(0, 4)}`) : reportYearMonth
}
export function reportYearMonthToTextShort(reportYearMonth: string): string {
    const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec'
    ]
    const month = Number(reportYearMonth.slice(4, 6)) - 1
    return month < months.length ? (`${months[month]} ${reportYearMonth.slice(0, 4)}`) : reportYearMonth
}

/**
 * Retrieves destination configuration with renewed token
 * @returns HTTPDestination
*/
export async function getServiceDestination(transformation: 'ANS' | 'TargetUrl' | 'UAA' | 'Destination', ServiceBindingName: string): Promise<HttpDestination> {
    let serviceBindingTransformFn = serviceBindingTransformFn_Destinations
    if (transformation == 'ANS') serviceBindingTransformFn = serviceBindingTransformFn_ANS
    if (transformation == 'TargetUrl') serviceBindingTransformFn = serviceBindingTransformFn_TargetUrl
    if (transformation == 'UAA') serviceBindingTransformFn = serviceBindingTransformFn_UAA

    return getDestinationFromServiceBinding({ destinationName: ServiceBindingName, serviceBindingTransformFn }) as Promise<HttpDestination>
}
async function serviceBindingTransformFn_Destinations(service: Service, options: ServiceBindingTransformOptions | undefined): Promise<HttpDestination> {
    const token = await serviceToken(service, options)
    const exp = decodeJwt(token).exp
    return {
        url: `${service.credentials.uri}/destination-configuration/v1`,
        authentication: 'OAuth2ClientCredentials',
        authTokens: authTokenSnippet(token, exp)
    }
}
async function serviceBindingTransformFn_ANS(service: Service, options: ServiceBindingTransformOptions | undefined): Promise<HttpDestination> {
    const token = await serviceToken({
        ...service,
        credentials: {
            clientid: service.credentials.client_id,
            clientsecret: service.credentials.client_secret,
            url: service.credentials.oauth_url
        }
    }, options)
    const exp = decodeJwt(token).exp
    return {
        url: service.credentials.url,
        authentication: 'OAuth2ClientCredentials',
        authTokens: authTokenSnippet(token, exp)
    }
}
async function serviceBindingTransformFn_TargetUrl(service: Service, options: ServiceBindingTransformOptions | undefined): Promise<HttpDestination> {
    const token = await serviceToken(service, options)
    const exp = decodeJwt(token).exp
    return {
        url: service.credentials.target_url,
        authentication: 'OAuth2ClientCredentials',
        authTokens: authTokenSnippet(token, exp)
    }
}
async function serviceBindingTransformFn_UAA(service: Service, options: ServiceBindingTransformOptions | undefined): Promise<HttpDestination> {
    const token = await serviceToken({ ...service, credentials: { ...service.credentials.uaa } }, options)
    const exp = decodeJwt(token).exp
    return {
        url: service.credentials.url,
        authentication: 'OAuth2ClientCredentials',
        authTokens: authTokenSnippet(token, exp)
    }
}
function authTokenSnippet(token: string, exp: number | undefined): DestinationAuthToken[] {
    return [{
        value: token,
        type: 'bearer',
        expiresIn: exp && Math.floor((exp * 1000 - Date.now()) / 1000).toString(10) || '0',
        http_header: { key: 'Authorization', value: `Bearer ${token}` },
        error: null
    }]
}
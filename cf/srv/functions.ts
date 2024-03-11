import cds from '@sap/cds'
import { TTag } from '#cds-models/types'

const info = cds.log('functions').info

export function fixDecimals(n: number | string | undefined, scale: number = 2) {
    if (typeof n == 'number') return Number(n.toFixed(scale))
    if (typeof n == 'string') return Number(Number(n).toFixed(scale))
    return 0
}

export function dateToYearMonth(date?: Date) {
    return (date ? date : new Date())
        .toISOString()
        .split('T')[0]
        .split('-')
        .slice(0, 2)
        .join('')
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
    return [y, m, d].join('-')
}

export function dateToISODate(date?: Date) {
    return (date ? date : new Date()).toISOString().split('T')[0]
}

export function groupByKeys<T>(items: T[], keys: (keyof T)[]): { [key: string]: T[] } {
    return items.reduce((p, c) => {
        const id = keys.map(x => c[x]).join('__')
        p[id] = p[id] || []
        p[id].push(c)
        return p
    }, {} as { [key: string]: T[] })
}

export function flattenObject(object: Record<string, any>, parent?: string) {
    const flattened: Record<string, any> = {}
    for (const [k, v] of Object.entries(object)) {
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
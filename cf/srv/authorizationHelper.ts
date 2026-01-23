import cds from '@sap/cds'
import { Request, Query } from '@sap/cds'
import { AccountStructureItems } from '#cds-models/db'

const info = cds.log('authorizationHelper').info

/**
 * CQN expression types for WHERE clause manipulation
 */
type CqnRef = { ref: string[] }
type CqnVal = { val: unknown }
type CqnList = { list: CqnVal[] }
type CqnExpr = CqnRef | CqnVal | CqnList | string
type CqnWhere = CqnExpr[]

interface SelectQuery {
    SELECT?: {
        where?: CqnWhere
    }
}

/**
 * Adds an IN filter condition to the query's WHERE clause using direct CQN manipulation.
 * This properly handles combining with existing WHERE conditions using AND.
 *
 * @param query - The CQN query object (typically req.query)
 * @param field - The field name to filter on
 * @param values - Array of values for the IN clause
 */
export function addInFilter(query: Query, field: string, values: string[]): void {
    const selectQuery = query as SelectQuery

    if (!selectQuery.SELECT) {
        return // Not a SELECT query
    }

    // Build the IN condition as CQN array
    // Format: [{ ref: ['field'] }, 'in', { list: [{ val: 'v1' }, { val: 'v2' }, ...] }]
    const inCondition: CqnWhere = [
        { ref: [field] },
        'in',
        { list: values.map(v => ({ val: v })) }
    ]

    if (selectQuery.SELECT.where && selectQuery.SELECT.where.length > 0) {
        // Combine existing WHERE with new condition using AND
        // Wrap existing in parentheses by using xpr if needed, or just AND them
        selectQuery.SELECT.where = [
            '(', ...selectQuery.SELECT.where, ')',
            'and',
            '(', ...inCondition, ')'
        ]
    } else {
        // No existing WHERE, just set the new condition
        selectQuery.SELECT.where = inCondition
    }
}

/**
 * User access context containing resolved subaccount IDs
 */
export interface UserAccessContext {
    /** True for admins/system-users (no filtering needed) */
    isUnrestricted: boolean
    /** Resolved list of all accessible AccountStructureItem IDs */
    allowedIds: string[]
}

/**
 * Checks if the user has unrestricted access (Admin role or system-user)
 * - System users (JOBSCHEDULER) have full access for background jobs
 * - Users with Admin scope have full access
 * - Users with Viewer role but NO SubaccountAccess attribute see NO data
 */
export function hasUnrestrictedAccess(req: Request): boolean {
    // System user check (job scheduler background jobs)
    if (req.user?.is('system-user')) {
        info(`User ${req.user?.id} is system-user, granting unrestricted access`)
        return true
    }

    // Admin scope check - users with Admin role have full access
    if (req.user?.is('Admin')) {
        info(`User ${req.user?.id} has Admin scope, granting unrestricted access`)
        return true
    }

    return false
}

/**
 * Gets the SubaccountAccess attribute values from the user's JWT token
 * Returns empty array if attribute is not set (which means NO access for Viewer role)
 */
export function getSubaccountAccessAttribute(req: Request): string[] {
    // Access user attributes via req.user.attr
    const userAttr = req.user?.attr
    const subaccountAccess = userAttr?.SubaccountAccess

    if (!subaccountAccess) {
        return []
    }

    // Attribute can be string (single value) or array (multiple values)
    if (Array.isArray(subaccountAccess)) {
        return subaccountAccess.filter(id => typeof id === 'string' && id.length > 0)
    }

    if (typeof subaccountAccess === 'string' && subaccountAccess.length > 0) {
        return [subaccountAccess]
    }

    return []
}

/**
 * Resolves the full user access context, including hierarchy expansion.
 * This is the main entry point for authorization checks in service handlers.
 *
 * @param req - The CAP request object containing user context
 * @returns UserAccessContext with isUnrestricted flag and list of allowed IDs
 */
export async function getUserAccessContext(req: Request): Promise<UserAccessContext> {
    // Check for unrestricted access first (Admin or system-user)
    if (hasUnrestrictedAccess(req)) {
        return { isUnrestricted: true, allowedIds: [] }
    }

    // Get the SubaccountAccess attribute values
    const attributeIds = getSubaccountAccessAttribute(req)

    // If no attribute values, user has NO access (Viewer without attributes)
    if (attributeIds.length === 0) {
        return { isUnrestricted: false, allowedIds: [] }
    }

    // Resolve hierarchy: get all descendants of the attributed IDs
    const allAccessibleIds = await resolveHierarchy(attributeIds)

    return {
        isUnrestricted: false,
        allowedIds: allAccessibleIds
    }
}

/**
 * Resolves hierarchy by getting all descendant IDs from given IDs.
 * - If a user has access to a Subaccount, they can see that Subaccount and its children (Spaces, Instances)
 * - If a user has access to a Directory, they can see all child Subaccounts and their descendants
 * - If a user has access to a Global Account, they can see all Directories, Subaccounts, and descendants
 *
 * NOTE: Ancestors are NOT included. Parent-level rows contain aggregated data from ALL children,
 * including subaccounts the user may not have access to. Only the assigned IDs and their
 * descendants are included in the access scope.
 *
 * Uses in-memory traversal for portability across database types.
 *
 * @param assignedIds - Array of AccountStructureItem IDs from the user's attribute
 * @returns Array of all accessible IDs (assigned + all descendants only, NO ancestors)
 */
export async function resolveHierarchy(assignedIds: string[]): Promise<string[]> {
    if (assignedIds.length === 0) {
        return []
    }

    // Query all AccountStructureItems to build the hierarchy
    const allItems = await SELECT.from(AccountStructureItems).columns('ID', 'parentID', 'level')

    const result = new Set<string>()

    // Add the assigned IDs themselves (user always has access to their directly assigned IDs)
    assignedIds.forEach(id => result.add(id))

    // Build parent→children map for efficient lookup (for descendants)
    const childrenMap = new Map<string, string[]>()

    for (const item of allItems) {
        if (item.parentID) {
            // For descendants lookup
            const children = childrenMap.get(item.parentID) || []
            children.push(item.ID!)
            childrenMap.set(item.parentID, children)
        }
    }

    // Recursively add all descendants of each assigned ID
    function addDescendants(parentId: string): void {
        const children = childrenMap.get(parentId) || []
        for (const childId of children) {
            if (!result.has(childId)) {
                result.add(childId)
                addDescendants(childId) // Recurse to get grandchildren, etc.
            }
        }
    }

    // Only add descendants, NOT ancestors
    // Ancestors contain aggregated data from all children (including inaccessible ones)
    assignedIds.forEach(addDescendants)

    return Array.from(result)
}

/**
 * Helper to check if a specific ID is accessible to the user
 * Useful for protecting individual record access in write operations
 *
 * @param id - The AccountStructureItem ID to check
 * @param context - The user's access context
 * @returns true if the ID is accessible
 */
export function isIdAccessible(id: string, context: UserAccessContext): boolean {
    if (context.isUnrestricted) {
        return true
    }
    return context.allowedIds.includes(id)
}

/**
 * Gets the Global Account IDs that the user has DIRECT access to.
 * This is used for entities that aggregate at Global Account level (like BillingDifferences).
 *
 * A user has direct access to a Global Account if:
 * 1. They were directly assigned the Global Account ID in their SubaccountAccess attribute, OR
 * 2. They were assigned a level ABOVE Global Account (Directory access doesn't exist, so this means Customer)
 *
 * Users who only have Subaccount-level access should NOT see Global Account aggregated data,
 * because that would expose data from other subaccounts they don't have access to.
 *
 * @param req - The CAP request object containing user context
 * @returns Array of Global Account IDs the user has direct access to
 */
export async function getDirectGlobalAccountAccess(req: Request): Promise<string[]> {
    // System users and Admins have full access
    if (hasUnrestrictedAccess(req)) {
        return [] // Empty means no filtering needed
    }

    // Get the raw attribute values (before hierarchy expansion)
    const attributeIds = getSubaccountAccessAttribute(req)

    if (attributeIds.length === 0) {
        return [] // No access
    }

    // Query AccountStructureItems to find which of these IDs are at Global Account level or higher
    const items = await SELECT.from(AccountStructureItems)
        .columns('ID', 'level')
        .where({ ID: { in: attributeIds } })

    const globalAccountIds: string[] = []

    for (const item of items) {
        // Only include IDs that are at Global Account level
        // (Customer level is excluded by design - it aggregates ALL data)
        if (item.level === 'Global Account') {
            globalAccountIds.push(item.ID!)
        }
    }

    return globalAccountIds
}

/**
 * Service key composite type for BTPServices
 */
export interface BTPServiceKey {
    reportYearMonth: string
    serviceId: string
    retrieved: string
    interval: string
}

/**
 * Gets the list of unique service IDs that have at least one accessible CommercialMeasure.
 * This is used to filter BulkTechnicalAllocations and BulkForecastSettings.
 *
 * @param allowedIds - Array of accessible AccountStructureItem IDs
 * @returns Array of accessible service IDs
 */
export async function getAccessibleServiceIds(allowedIds: string[]): Promise<string[]> {
    if (allowedIds.length === 0) {
        return []
    }

    // Query CommercialMeasures to find distinct service IDs that have measures with accessible IDs
    const measures = await SELECT.distinct
        .from('db.CommercialMeasures')
        .columns('toMetric.toService.serviceId as serviceId')
        .where({ id: { in: allowedIds } })

    const serviceIds = measures.map((m: { serviceId: string }) => m.serviceId).filter(Boolean)

    return serviceIds
}

/**
 * Gets the list of BTPService composite keys that have at least one accessible CommercialMeasure.
 * This is used to filter BTPServices at the database level.
 *
 * @param allowedIds - Array of accessible AccountStructureItem IDs
 * @returns Array of composite keys for accessible services
 */
export async function getAccessibleServiceKeys(allowedIds: string[]): Promise<BTPServiceKey[]> {
    if (allowedIds.length === 0) {
        return []
    }

    // Query CommercialMeasures to find services that have measures with accessible IDs
    // We need distinct combinations of the BTPServices composite key
    const measures = await SELECT.distinct
        .from('db.CommercialMeasures')
        .columns(
            'toMetric.toService.reportYearMonth as reportYearMonth',
            'toMetric.toService.serviceId as serviceId',
            'toMetric.toService.retrieved as retrieved',
            'toMetric.toService.interval as interval'
        )
        .where({ id: { in: allowedIds } })

    return measures as BTPServiceKey[]
}

/**
 * Adds a filter to the query to only include BTPServices that have accessible measures.
 * Uses a simple serviceId IN (...) filter for efficiency.
 * The AFTER handler (filterNestedMeasures) handles fine-grained measure filtering.
 *
 * @param query - The CQN query object
 * @param serviceKeys - Array of accessible service composite keys
 * @param fieldPrefix - Optional prefix for field names (e.g., 'toService_' for CommercialMetrics)
 */
export function addServiceKeyFilter(query: Query, serviceKeys: BTPServiceKey[], fieldPrefix: string = ''): void {
    if (serviceKeys.length === 0) {
        // No accessible services - add impossible condition
        addInFilter(query, `${fieldPrefix}serviceId`, ['__NO_ACCESS__'])
        return
    }

    // Extract unique serviceIds for efficient IN clause filtering
    // Fine-grained filtering is done in the AFTER handler via filterNestedMeasures
    const uniqueServiceIds = [...new Set(serviceKeys.map(k => k.serviceId))]

    addInFilter(query, `${fieldPrefix}serviceId`, uniqueServiceIds)
}

/**
 * Filters an array of items to only include accessible ones
 * Useful for post-filtering in AFTER handlers
 *
 * @param items - Array of items with an id property
 * @param idField - The field name containing the AccountStructureItem ID
 * @param context - The user's access context
 * @returns Filtered array containing only accessible items
 */
export function filterAccessibleItems<T extends Record<string, unknown>>(
    items: T[] | undefined,
    idField: keyof T,
    context: UserAccessContext
): T[] {
    if (!items) return []
    if (context.isUnrestricted) return items

    return items.filter(item => {
        const id = item[idField]
        return typeof id === 'string' && context.allowedIds.includes(id)
    })
}

/**
 * Levels that contain aggregated data from all children.
 * For restricted users, measures at these levels should be excluded because
 * they include data from subaccounts the user doesn't have access to.
 */
const AGGREGATED_LEVELS = ['Customer', 'Global Account', 'Directory']

/**
 * Gets the list of allowed IDs filtered to only include non-aggregated levels.
 * This excludes Customer, Global Account, and Directory levels which contain
 * aggregated data from all their children (including inaccessible subaccounts).
 *
 * @param allowedIds - Array of accessible AccountStructureItem IDs
 * @returns Array of IDs at SubAccount level and below only
 */
export async function getSubAccountLevelIds(allowedIds: string[]): Promise<string[]> {
    if (allowedIds.length === 0) {
        return []
    }

    // Query AccountStructureItems to find which IDs are at SubAccount level or below
    const items = await SELECT.from(AccountStructureItems)
        .columns('ID', 'level')
        .where({ ID: { in: allowedIds } })

    const filteredIds: string[] = []
    for (const item of items) {
        // Only include IDs that are NOT at aggregated levels
        if (!AGGREGATED_LEVELS.includes(item.level!)) {
            filteredIds.push(item.ID!)
        }
    }

    return filteredIds
}

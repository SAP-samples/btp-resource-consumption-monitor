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
    info(`User attributes: ${JSON.stringify(userAttr)}`)

    const subaccountAccess = userAttr?.SubaccountAccess

    if (!subaccountAccess) {
        info(`No SubaccountAccess attribute found for user ${req.user?.id}`)
        return []
    }

    // Attribute can be string (single value) or array (multiple values)
    if (Array.isArray(subaccountAccess)) {
        const filtered = subaccountAccess.filter(id => typeof id === 'string' && id.length > 0)
        info(`SubaccountAccess (array): ${filtered.join(', ')}`)
        return filtered
    }

    if (typeof subaccountAccess === 'string' && subaccountAccess.length > 0) {
        info(`SubaccountAccess (string): ${subaccountAccess}`)
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
        info(`User ${req.user?.id} has Viewer role but no SubaccountAccess attribute - NO data access`)
        return { isUnrestricted: false, allowedIds: [] }
    }

    info(`User ${req.user?.id} has SubaccountAccess attribute: ${attributeIds.join(', ')}`)

    // Resolve hierarchy: get all descendants of the attributed IDs
    const allAccessibleIds = await resolveHierarchy(attributeIds)
    info(`Resolved ${allAccessibleIds.length} accessible IDs for user ${req.user?.id}`)

    return {
        isUnrestricted: false,
        allowedIds: allAccessibleIds
    }
}

/**
 * Resolves hierarchy by getting all descendant IDs from given parent IDs.
 * If a user has access to a Directory, they can see all child Subaccounts.
 * If a user has access to a Global Account, they can see all Directories and Subaccounts.
 *
 * Uses in-memory traversal for portability across database types.
 *
 * @param parentIds - Array of AccountStructureItem IDs from the user's attribute
 * @returns Array of all accessible IDs (parents + all descendants)
 */
export async function resolveHierarchy(parentIds: string[]): Promise<string[]> {
    if (parentIds.length === 0) {
        return []
    }

    // Query all AccountStructureItems to build the hierarchy
    // This is more portable than database-specific recursive CTEs
    const allItems = await SELECT.from(AccountStructureItems).columns('ID', 'parentID')

    const result = new Set<string>()

    // Add the parent IDs themselves (user always has access to their directly assigned IDs)
    parentIds.forEach(id => result.add(id))

    // Build parent→children map for efficient lookup
    const childrenMap = new Map<string, string[]>()
    for (const item of allItems) {
        if (item.parentID) {
            const children = childrenMap.get(item.parentID) || []
            children.push(item.ID!)
            childrenMap.set(item.parentID, children)
        }
    }

    // Recursively add all descendants of each parent ID
    function addDescendants(parentId: string): void {
        const children = childrenMap.get(parentId) || []
        for (const childId of children) {
            if (!result.has(childId)) {
                result.add(childId)
                addDescendants(childId) // Recurse to get grandchildren, etc.
            }
        }
    }

    parentIds.forEach(addDescendants)

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

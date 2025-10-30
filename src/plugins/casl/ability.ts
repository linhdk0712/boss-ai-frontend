import { createMongoAbility, type MongoAbility } from '@casl/ability'
import type { UserInfo } from '@/types/auth'

export type Subjects = 'User' | 'Admin' | 'Dashboard' | 'all'
export type Actions = 'manage' | 'create' | 'read' | 'update' | 'delete' | 'all'

export type AppAbility = MongoAbility<[Actions, Subjects]>

/**
 * Create ability based on user role
 */
export const createAbility = (user: UserInfo | null): AppAbility => {
    if (!user) {
        // Guest user - no permissions
        return createMongoAbility([])
    }

    if (user.role === 'ADMIN') {
        // Admin can do everything
        return createMongoAbility([
            { action: 'manage', subject: 'all' }
        ])
    }

    // Regular user permissions
    return createMongoAbility([
        { action: 'read', subject: 'Dashboard' },
        { action: 'manage', subject: 'Dashboard' }, // Full dashboard access for users
        { action: 'read', subject: 'User' },
        { action: 'update', subject: 'User' } // Can update their own profile
    ])
}

/**
 * Default ability for unauthenticated users
 */
export const defaultAbility = createAbility(null)
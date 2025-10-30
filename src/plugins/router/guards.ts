import type { Router } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

export function setupAuthGuards(router: Router) {
    // Global before guard
    router.beforeEach(async (to, from, next) => {
        const authStore = useAuthStore()

        // Initialize auth store if not already done
        if (!authStore.currentUser && localStorage.getItem('accessToken')) {
            authStore.initializeAuth()
        }

        const isAuthenticated = authStore.isAuthenticated
        const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
        const unauthenticatedOnly = to.matched.some(record => record.meta.unauthenticatedOnly)

        // If route requires authentication and user is not authenticated
        if (requiresAuth && !isAuthenticated) {
            next({
                name: 'login',
                query: { to: to.fullPath }
            })
            return
        }

        // If route is for unauthenticated users only and user is authenticated
        if (unauthenticatedOnly && isAuthenticated) {
            // Redirect based on user role
            const redirectPath = authStore.isAdmin ? '/admin/dashboard' : '/dashboard'
            next(redirectPath)
            return
        }

        // Check role-based access
        const requiredRole = to.meta.role as string
        if (requiredRole && authStore.currentUser?.role !== requiredRole) {
            next('/not-authorized')
            return
        }

        next()
    })
}
import { canNavigate } from '@layouts/plugins/casl'
import { useAuthStore } from '@/stores/auth'
import { useCookie } from '@core/composable/useCookie'

export const setupGuards = (router: any) => {
  // 👉 router.beforeEach
  // Docs: https://router.vuejs.org/guide/advanced/navigation-guards.html#global-before-guards
  router.beforeEach((to: any) => {
    /*
     * If it's a public route, continue navigation. This kind of pages are allowed to visited by login & non-login users. Basically, without any restrictions.
     * Examples of public routes are, 404, under maintenance, etc.
     */
    if (to.meta.public)
      return

    // Get auth store instance
    const authStore = useAuthStore()

    // Initialize auth store if not already done
    if (!authStore.currentUser && localStorage.getItem('accessToken')) {
      authStore.initializeAuth()
    }

    /**
     * Check if user is logged in using our new auth system
     * Also fallback to cookie-based check for backward compatibility
     */
    const isLoggedIn = authStore.isAuthenticated || !!(useCookie('userData').value && useCookie('accessToken').value)

    /*
      If user is logged in and is trying to access login like page, redirect based on role
      else allow visiting the page
      (WARN: Don't allow executing further by return statement because next code will check for permissions)
     */
    if (to.meta.unauthenticatedOnly) {
      if (isLoggedIn) {
        // Redirect based on user role
        const redirectPath = authStore.isAdmin ? '/admin/dashboards/analytics' : '/dashboards/analytics'
        return redirectPath
      } else {
        return undefined
      }
    }

    /*
     * If user is not logged in and trying to access protected route,
     * redirect to login with return path
     */
    if (!isLoggedIn && to.meta.requiresAuth !== false) {
      return {
        name: 'login',
        query: {
          ...to.query,
          to: to.fullPath !== '/' ? to.path : undefined,
        },
      }
    }

    // ========== ROLE-BASED URL PATTERN ENFORCEMENT ==========
    if (isLoggedIn) {
      const currentPath = to.path as string
      const isAdminPath = currentPath.startsWith('/admin/')
      const isUserPath = !currentPath.startsWith('/admin/') &&
        !currentPath.startsWith('/login') &&
        !currentPath.startsWith('/register') &&
        !currentPath.startsWith('/forgot-password') &&
        !currentPath.startsWith('/activate') &&
        !currentPath.startsWith('/not-authorized') &&
        !currentPath.startsWith('/front-pages/')

      // ADMIN users: enforce /admin/** pattern for protected pages
      if (authStore.isAdmin) {
        // If admin is trying to access user pages (non-admin paths), redirect to admin equivalent
        if (isUserPath && to.meta.requiresAuth !== false) {
          // Map user paths to admin paths
          const adminPath = mapUserPathToAdminPath(currentPath)
          if (adminPath && adminPath !== currentPath) {
            return adminPath
          }
        }
      }

      // USER users: enforce /** pattern (no /admin/ access)
      if (!authStore.isAdmin) {
        // If user is trying to access admin paths, redirect to user equivalent
        if (isAdminPath) {
          const userPath = mapAdminPathToUserPath(currentPath)
          return userPath || '/dashboards/analytics'
        }
      }
    }

    // Check role-based access for authenticated users
    const requiredRole = to.meta.role as string
    if (isLoggedIn && requiredRole && authStore.currentUser?.role !== requiredRole) {
      // If user doesn't have required role, redirect to appropriate dashboard
      const redirectPath = authStore.isAdmin ? '/admin/dashboards/analytics' : '/dashboards/analytics'
      return redirectPath
    }

    // Check CASL permissions (for more granular permissions)
    // Only check CASL if the route has specific action/subject requirements
    const hasSpecificPermissions = to.matched.some((route: any) => route.meta?.action && route.meta?.subject)
    if (hasSpecificPermissions && !canNavigate(to) && to.matched.length) {
      /* eslint-disable indent */
      return isLoggedIn
        ? { name: 'not-authorized' }
        : {
          name: 'login',
          query: {
            ...to.query,
            to: to.fullPath !== '/' ? to.path : undefined,
          },
        }
      /* eslint-enable indent */
    }
  })
}

/**
 * Map user paths to admin paths
 */
function mapUserPathToAdminPath(userPath: string): string | null {
  const pathMappings: Record<string, string> = {
    '/dashboards/analytics': '/admin/dashboards/analytics',
    '/dashboards/crm': '/admin/dashboards/crm',
    '/dashboards/ecommerce': '/admin/dashboards/ecommerce',
    '/apps/user': '/admin/apps/user',
    '/apps/roles': '/admin/apps/roles',
    '/apps/permissions': '/admin/apps/permissions',
    '/components': '/admin/components',
    '/dashboard': '/admin/dashboards/analytics',
    '/': '/admin/dashboards/analytics'
  }

  // Direct mapping
  if (pathMappings[userPath]) {
    return pathMappings[userPath]
  }

  // Pattern-based mapping
  if (userPath.startsWith('/apps/')) {
    return `/admin${userPath}`
  }
  if (userPath.startsWith('/dashboards/')) {
    return `/admin${userPath}`
  }
  if (userPath.startsWith('/components')) {
    return `/admin${userPath}`
  }

  return null
}

/**
 * Map admin paths to user paths
 */
function mapAdminPathToUserPath(adminPath: string): string | null {
  // Remove /admin prefix
  const userPath = adminPath.replace(/^\/admin/, '') || '/'

  const pathMappings: Record<string, string> = {
    '/': '/dashboards/analytics',
    '/dashboard': '/dashboards/analytics',
    '/dashboards/analytics': '/dashboards/analytics',
    '/dashboards/crm': '/dashboards/crm',
    '/dashboards/ecommerce': '/dashboards/ecommerce'
  }

  return pathMappings[userPath] || '/dashboards/analytics'
}

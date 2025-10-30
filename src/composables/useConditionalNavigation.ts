import { computed } from 'vue'
import type { VerticalNavItems } from '@layouts/types'

/**
 * Composable to provide conditional navigation based on current route
 * When on analytics dashboard, only show Analytics Dashboard in sidebar
 */
export function useConditionalNavigation(defaultNavItems: VerticalNavItems) {
    const route = useRoute()

    // Analytics-only navigation for clean interface
    const analyticsOnlyNav: VerticalNavItems = [
        {
            title: 'Analytics Dashboard',
            icon: { icon: 'tabler-chart-pie-2' },
            to: 'dashboards-analytics',
            action: 'read',
            subject: 'Dashboard',
        },
    ]

    // Computed navigation that switches based on current route
    const conditionalNavItems = computed(() => {
        // If on analytics dashboard route, show only analytics navigation
        if (route.name === 'dashboards-analytics') {
            return analyticsOnlyNav
        }

        // Otherwise, show full navigation
        return defaultNavItems
    })

    return {
        conditionalNavItems,
        isAnalyticsRoute: computed(() => route.name === 'dashboards-analytics'),
    }
}
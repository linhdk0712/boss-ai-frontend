import { computed } from 'vue'
import type { VerticalNavItems } from '@layouts/types'

/**
 * Composable to provide conditional navigation based on current route
 * Always shows full navigation including Dashboard and Content menus
 */
export function useConditionalNavigation(defaultNavItems: VerticalNavItems) {
    const route = useRoute()

    // Always return the default navigation items (no conditional logic)
    const conditionalNavItems = computed(() => {
        return defaultNavItems
    })

    return {
        conditionalNavItems,
        isAnalyticsRoute: computed(() => route.name === 'dashboards-analytics'),
        isContentOnlyRoute: computed(() => false),
    }
}
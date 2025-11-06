import { computed } from 'vue'
import type { VerticalNavItems } from '@layouts/types'

/**
 * Composable to provide conditional navigation based on current route
 * When on analytics dashboard, hide Dashboard menu and show only content navigation
 */
export function useConditionalNavigation(defaultNavItems: VerticalNavItems) {
    const route = useRoute()

    // Content-only navigation for clean interface (no Dashboard menu)
    const contentOnlyNav: VerticalNavItems = [
        {
            title: 'AI Content Generation',
            icon: { icon: 'tabler-wand' },
            action: 'read',
            subject: 'Content',
            children: [
                { title: 'Generate Content', to: 'content-index', action: 'manage', subject: 'Content' },
                { title: 'My Content', to: 'content-list', action: 'read', subject: 'Content' },
                { title: 'Job Queue Management', to: 'job-queue-index', action: 'read', subject: 'JobQueue' },
            ],
        },
    ]

    // Computed navigation that switches based on current route
    const conditionalNavItems = computed(() => {
        // If on analytics dashboard, content routes, or job-queue routes, show content navigation only
        if (route.name === 'dashboards-analytics' ||
            route.name?.toString().startsWith('content-') ||
            route.name?.toString().startsWith('job-queue-')) {
            return contentOnlyNav
        }

        // Otherwise, show full navigation
        return defaultNavItems
    })

    return {
        conditionalNavItems,
        isAnalyticsRoute: computed(() => route.name === 'dashboards-analytics'),
        isContentOnlyRoute: computed(() =>
            route.name === 'dashboards-analytics' ||
            route.name?.toString().startsWith('content-') ||
            route.name?.toString().startsWith('job-queue-')
        ),
    }
}
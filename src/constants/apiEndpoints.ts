export const API_ENDPOINTS = {
    // Authentication
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        ACTIVATE: '/auth/user-active',
        REFRESH: '/auth/refresh',
    },

    // User Management
    USERS: {
        BASE: '/users',
        BY_ID: (id: number) => `/users/${id}`,
        PROFILE: '/users/profile',
    },

    // Configuration Management
    CONFIG: {
        INDUSTRY: '/config/industry',
        CONTENT_TYPE: '/config/content-type',
        LANGUAGE: '/config/language',
        TONE: '/config/tone',
        TARGET_AUDIENCE: '/config/target-audience',
    },

    // Content Generation
    CONTENT: {
        BASE: '/content',
        BY_ID: (id: number) => `/content/${id}`,
        GENERATE: '/content/generate',
        GENERATE_ASYNC: '/queue/jobs',
        SAVE: '/content/save',
        WORKFLOW: '/content/workflow',
        WORKFLOW_ASYNC: '/content/workflow-async',
        LIST: '/content/list',
        USER_CONTENTS: '/content/user',
        VIDEO_STATUS: (id: number) => `/content/${id}/video-status`,
        VIDEO_RETRY: (id: number) => `/content/${id}/video-retry`,
        VIDEO_DOWNLOAD: (id: number) => `/content/${id}/video-download`,
        JOB_STATUS: (jobId: string) => `/content/jobs/${jobId}/status`,
        JOB_CANCEL: (jobId: string) => `/content/jobs/${jobId}/cancel`,

        // Version Management
        VERSIONS: (contentId: number) => `/content/${contentId}/versions`,
        VERSION_BY_NUMBER: (contentId: number, versionNumber: number) => `/content/${contentId}/versions/${versionNumber}`,
        VERSION_REVERT: (contentId: number, versionNumber: number) => `/content/${contentId}/versions/${versionNumber}/revert`,
        VERSION_STATISTICS: (contentId: number) => `/content/${contentId}/versions/statistics`,
        VERSION_COMPARE: (contentId: number) => `/content/${contentId}/versions/compare`,
        VERSION_COMPARE_SIDE_BY_SIDE: (contentId: number) => `/content/${contentId}/versions/compare/side-by-side`,
        VERSION_BRANCHES: (contentId: number) => `/content/${contentId}/versions/branches`,
        VERSION_TAGS: (contentId: number) => `/content/${contentId}/versions/tags`,
        VERSION_TAG: (contentId: number, versionNumber: number) => `/content/${contentId}/versions/${versionNumber}/tag`,
        VERSION_SORTED: (contentId: number) => `/content/${contentId}/versions/sorted`,
    },

    // Queue Management
    QUEUE: {
        BASE: '/queue',
        JOBS: '/queue/jobs',
        JOB_BY_ID: (jobId: string) => `/queue/jobs/${jobId}`,
        STATISTICS: '/queue/statistics',
        CLEANUP: '/queue/cleanup',
    },

    // Job Queue Management
    JOBS: {
        BASE: '/jobs',
        BY_ID: (id: number) => `/jobs/${id}`,
        DETAILS: (id: number) => `/jobs/${id}/details`,
        RETRY: (id: number) => `/jobs/${id}/retry`,
        DOWNLOAD: (id: number) => `/jobs/${id}/download`,
        LIST: '/jobs',
    },

    // Settings Management
    SETTINGS: {
        TONE: '/setting/tone',
        INDUSTRY: '/setting/industry',
        LANGUAGE: '/setting/language',
        TARGET_AUDIENCE: '/setting/target-audience',
        CONTENT_TYPE: '/setting/content-type',
        UPDATE: '/setting',
    },

    // Flow Management (N8N Node Runs)
    FLOW: {
        BASE: '/flow',
        BY_USER: (userId?: number) => userId ? `/flow?userId=${userId}` : '/flow',
    },

    // Template Management
    TEMPLATES: {
        BASE: '/templates',
        BY_ID: (id: number) => `/templates/${id}`,
        BY_CATEGORY: (category: string) => `/templates/category/${category}`,
        BY_INDUSTRY: (industry: string) => `/templates/industry/${industry}`,
        RECOMMENDED: '/templates/recommended',
        POPULAR: '/templates/popular',
        SEARCH: '/templates/search',
        APPLY: (id: number) => `/templates/${id}/apply`,
        RATE: (id: number) => `/templates/${id}/rate`,
        USAGE: (id: number) => `/templates/${id}/usage`,
    },

    // User Preset Management
    PRESETS: {
        BASE: '/presets',
        BY_ID: (id: number) => `/presets/${id}`,
        BY_CATEGORY: (category: string) => `/presets/category/${category}`,
        BY_CONTENT_TYPE: (contentType: string) => `/presets/content-type/${contentType}`,
        FAVORITES: '/presets/favorites',
        DEFAULT: '/presets/default',
        SEARCH: '/presets/search',
        MOST_USED: '/presets/most-used',
        RECENT: '/presets/recent',
        SHARE: (id: number) => `/presets/${id}/share`,
        UNSHARE: (id: number) => `/presets/${id}/unshare`,
        WORKSPACE: (workspaceId: number) => `/presets/workspace/${workspaceId}`,
        EXPORT: (id: number) => `/presets/${id}/export`,
        IMPORT: '/presets/import',
        ANALYTICS: (id: number) => `/presets/${id}/analytics`,
        USER_ANALYTICS: '/presets/analytics',
        OPTIMIZATION: (id: number) => `/presets/${id}/optimization`,
        ALL_OPTIMIZATION: '/presets/optimization',
    },
} as const

// Export individual endpoint groups for easier imports
export const { AUTH, USERS, CONFIG, CONTENT, QUEUE, JOBS, SETTINGS, FLOW, TEMPLATES, PRESETS } = API_ENDPOINTS
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
        GENERATE_ASYNC: '/content/generate-async',
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

    // Settings Management
    SETTINGS: {
        TONE: '/setting/tone',
        INDUSTRY: '/setting/industry',
        LANGUAGE: '/setting/language',
        TARGET_AUDIENCE: '/setting/target-audience',
        CONTENT_TYPE: '/setting/content-type',
        UPDATE: '/setting',
    },
} as const

// Export individual endpoint groups for easier imports
export const { AUTH, USERS, CONFIG, CONTENT, SETTINGS } = API_ENDPOINTS
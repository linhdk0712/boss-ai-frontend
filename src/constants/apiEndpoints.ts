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
        SAVE: '/content/save',
        WORKFLOW: '/content/workflow',
        LIST: '/content/list',
        USER_CONTENTS: '/content/user',
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
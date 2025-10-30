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
} as const

// Export individual endpoint groups for easier imports
export const { AUTH, USERS } = API_ENDPOINTS
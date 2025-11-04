export default [
    // Admin Dashboard
    {
        title: 'Admin Dashboard',
        icon: { icon: 'tabler-shield-check' },
        to: 'admin-dashboards-analytics',
        action: 'manage',
        subject: 'Admin',
    },

    // Admin Management
    {
        title: 'User Management',
        icon: { icon: 'tabler-users' },
        to: 'admin-apps-user',
        action: 'manage',
        subject: 'Admin',
    },

    // AI Provider Monitoring
    {
        title: 'AI Provider Monitoring',
        icon: { icon: 'tabler-cpu' },
        to: 'admin-ai-providers',
        action: 'manage',
        subject: 'Admin',
    },

    // Admin Dashboards
    {
        title: 'Admin Dashboards',
        icon: { icon: 'tabler-chart-pie-2' },
        children: [
            {
                title: 'Analytics',
                to: 'admin-dashboards-analytics',
                action: 'manage',
                subject: 'Admin',
            },
            {
                title: 'CRM',
                to: 'admin-dashboards-crm',
                action: 'manage',
                subject: 'Admin',
            },
            {
                title: 'Ecommerce',
                to: 'admin-dashboards-ecommerce',
                action: 'manage',
                subject: 'Admin',
            },
        ],
    },

    // Admin Apps
    {
        title: 'Admin Apps',
        icon: { icon: 'tabler-apps' },
        children: [
            {
                title: 'User Management',
                to: 'admin-apps-user',
                action: 'manage',
                subject: 'Admin',
            },
            {
                title: 'Roles & Permissions',
                to: 'admin-apps-roles',
                action: 'manage',
                subject: 'Admin',
            },
        ],
    },

    // Admin Components
    {
        title: 'Admin Components',
        icon: { icon: 'tabler-components' },
        to: 'admin-components',
        action: 'manage',
        subject: 'Admin',
    },
]
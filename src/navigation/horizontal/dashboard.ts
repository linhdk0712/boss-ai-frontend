export default [
  // User Analytics Dashboard
  {
    title: 'Analytics Dashboard',
    to: 'dashboards-analytics',
    icon: { icon: 'tabler-chart-pie-2' },
    action: 'read',
    subject: 'Dashboard',
  },

  // Admin Analytics Dashboard (only visible to admins)
  {
    title: 'Admin Analytics',
    to: 'admin-dashboards-analytics',
    icon: { icon: 'tabler-shield-check' },
    action: 'manage',
    subject: 'Admin',
  },

  {
    title: 'Dashboards',
    icon: { icon: 'tabler-smart-home' },
    children: [
      {
        title: 'Analytics',
        to: 'dashboards-analytics',
        icon: { icon: 'tabler-chart-pie-2' },
        action: 'read',
        subject: 'Dashboard',
      },
      {
        title: 'CRM',
        to: 'dashboards-crm',
        icon: { icon: 'tabler-cube' },
        action: 'read',
        subject: 'Dashboard',
      },
      {
        title: 'Ecommerce',
        to: 'dashboards-ecommerce',
        icon: { icon: 'tabler-shopping-cart' },
        action: 'read',
        subject: 'Dashboard',
      },
      {
        title: 'Academy',
        to: 'dashboards-academy',
        icon: { icon: 'tabler-book' },
        action: 'read',
        subject: 'Dashboard',
      },
      {
        title: 'Logistics',
        to: 'dashboards-logistics',
        icon: { icon: 'tabler-truck' },
        action: 'read',
        subject: 'Dashboard',
      },
    ],
  },
]

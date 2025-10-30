export default [
  // User Analytics Dashboard (main entry point)
  {
    title: 'Analytics Dashboard',
    icon: { icon: 'tabler-chart-pie-2' },
    to: 'dashboards-analytics',
    action: 'read',
    subject: 'Dashboard',
  },

  // User Dashboards
  {
    title: 'Dashboards',
    icon: { icon: 'tabler-smart-home' },
    children: [
      {
        title: 'Analytics',
        to: 'dashboards-analytics',
        action: 'read',
        subject: 'Dashboard',
      },
      {
        title: 'CRM',
        to: 'dashboards-crm',
        action: 'read',
        subject: 'Dashboard',
      },
      {
        title: 'Ecommerce',
        to: 'dashboards-ecommerce',
        action: 'read',
        subject: 'Dashboard',
      },
      {
        title: 'Academy',
        to: 'dashboards-academy',
        action: 'read',
        subject: 'Dashboard',
      },
      {
        title: 'Logistics',
        to: 'dashboards-logistics',
        action: 'read',
        subject: 'Dashboard',
      },
    ],
    badgeContent: '5',
    badgeClass: 'bg-error',
  },
]

export default [
  { heading: 'Apps & Pages' },
  {
    title: 'AI Content Generation',
    icon: { icon: 'tabler-wand' },
    action: 'read',
    subject: 'Content',
    children: [
      { title: 'Generate Content', to: 'content-index', action: 'manage', subject: 'Content' },
      // { title: 'Sync Generation (Legacy)', to: 'content-async-index', action: 'manage', subject: 'Content' },
      { title: 'My Content', to: 'content-list', action: 'read', subject: 'Content' },
      { title: 'Content Status', to: 'content-status', action: 'read', subject: 'Content' },
      { title: 'Job Queue Management', to: 'job-queue-index', action: 'read', subject: 'JobQueue' },
    ],
  },
  {
    title: 'Settings',
    icon: { icon: 'tabler-settings' },
    to: 'settings',
    action: 'read',
    subject: 'Settings',
  },
]

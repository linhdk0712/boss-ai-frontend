export default [
    {
        title: 'Content',
        icon: { icon: 'tabler-wand' },
        action: 'read',
        subject: 'Content',
        children: [
            {
                title: 'Generate Content',
                to: 'content-index',
                icon: { icon: 'tabler-wand' },
                action: 'manage',
                subject: 'Content',
            },
            {
                title: 'My Content',
                to: 'content-list',
                icon: { icon: 'tabler-list' },
                action: 'read',
                subject: 'Content',
            },

        ],
    },
]
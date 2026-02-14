import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: "Entix-App Docs",
    description: "Documentation for Entix-App",
    base: '/docs/',
    outDir: '../web/dist/docs',
    themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        nav: [
            { text: 'Home', link: '/' },
            { text: 'Setup', link: '/setup' },
            { text: 'API', link: '/api' }
        ],

        sidebar: [
            {
                text: 'Getting Started',
                items: [
                    { text: 'Setup & Development', link: '/setup' },
                    { text: 'Architecture', link: '/architecture' }
                ]
            },
            {
                text: 'Backend',
                items: [
                    { text: 'Database', link: '/database' },
                    { text: 'Authentication', link: '/authentication' },
                    { text: 'API & Errors', link: '/api' },
                    { text: 'Middleware', link: '/middleware' }
                ]
            },
            {
                text: 'Frontend',
                items: [
                    { text: 'Frontend', link: '/frontend' }
                ]
            },
            {
                text: 'Operations',
                items: [
                    { text: 'Testing', link: '/testing' },
                    { text: 'Deployment', link: '/deployment' },
                    { text: 'Troubleshooting', link: '/troubleshooting' }
                ]
            }
        ],

        socialLinks: [
            { icon: 'github', link: 'https://github.com/chen7david/entix-app' }
        ]
    }
})

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
            { text: 'How to Write Docs', link: '/how-to-write-docs' }
        ],

        sidebar: [
            {
                text: 'Onboarding',
                items: [
                    { text: 'Quick Start', link: '/' },
                    { text: 'Environment Setup', link: '/onboarding/setup' },
                    { text: 'Project Workflow', link: '/onboarding/workflow' }
                ]
            },
            {
                text: 'Development',
                items: [
                    { text: 'Create a Feature', link: '/features/create-new' },
                    { text: 'Naming Rules', link: '/naming/conventions' },
                    { text: 'Middleware & Guards', link: '/middleware/flow' }
                ]
            },
            {
                text: 'Operations',
                items: [
                    { text: 'Testing Guide', link: '/testing/guide' },
                    { text: 'Cloudflare Deployment', link: '/deployment/cloudflare' }
                ]
            },
            {
                text: 'Principles (Why?)',
                items: [
                    { text: 'Why .dev.vars?', link: '/why/dev-vars' },
                    { text: 'Why Protection?', link: '/why/branch-protection' },
                    { text: 'Why Service-Repo?', link: '/why/service-repository' },
                    { text: 'Why Strict Naming?', link: '/why/naming' },
                    { text: 'Why Guards?', link: '/why/guards' },
                    { text: 'Why Cloudflare Testing?', link: '/why/cloudflare-testing' },
                    { text: 'Why Cloudflare Pages?', link: '/why/cloudflare-pages' }
                ]
            }
        ],

        socialLinks: [
            { icon: 'github', link: 'https://github.com/chen7david/entix-app' }
        ]
    }
})

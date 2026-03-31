import { defineConfig } from "vitepress";

export default defineConfig({
    title: "Entix-App Docs",
    description: "Documentation for Entix-App",
    base: "/docs/",
    outDir: "../web/dist/docs",
    themeConfig: {
        nav: [
            { text: "Home", link: "/" },
            { text: "AI Reference", link: "/AI" },
        ],

        sidebar: [
            {
                text: "Architecture",
                items: [
                    { text: "Overview", link: "/architecture/01-overview" },
                    { text: "Request Lifecycle", link: "/architecture/02-request-lifecycle" },
                    { text: "Repo & Service Pattern", link: "/architecture/03-repository-service" },
                ],
            },
            {
                text: "How-To Guides",
                items: [
                    { text: "Create a Feature", link: "/how-to/01-create-new-feature" },
                    { text: "Defining Schemas", link: "/how-to/02-defining-schemas" },
                    { text: "OpenAPI & Routes", link: "/how-to/03-openapi-and-routes" },
                    { text: "Factories & DI", link: "/how-to/04-factory-and-di" },
                    { text: "Testing Guide", link: "/how-to/05-testing" },
                    { text: "Git Workflow", link: "/how-to/06-git-workflow" },
                ],
            },
            {
                text: "Frontend",
                items: [{ text: "Navigation", link: "/frontend/01-navigation" }],
            },
            {
                text: "Conventions",
                items: [{ text: "Naming Rules", link: "/conventions/01-naming" }],
            },
            {
                text: "Principles (Why?)",
                items: [
                    { text: "Why Service-Repo?", link: "/why/service-repository" },
                    { text: "Why No External Leakage?", link: "/why/external-dependencies" },
                ],
            },
        ],

        socialLinks: [{ icon: "github", link: "https://github.com/chen7david/entix-app" }],
    },
});

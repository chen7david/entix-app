import { AppOpenApi } from "@api/helpers/types.helpers";
import packageJson from "../../package.json";
import { Scalar } from "@scalar/hono-api-reference";

export const configureOpenApi = (app: AppOpenApi) => {
    app.doc("/api/v1/openapi", {
        openapi: "3.1.0",
        info: {
            title: "Entix API",
            version: packageJson.version,
        },
    })

    app.get('/api/v1/api-reference', Scalar({
        pageTitle: 'Entix API Reference',
        theme: 'purple',
        layout: 'classic',
        defaultHttpClient: {
            targetKey: 'js',
            clientKey: 'fetch',
        },
        sources: [
            {
                url: '/api/v1/openapi',
                title: 'Main API',
            },
            {
                url: '/api/v1/auth/open-api/generate-schema',
                title: 'Authentication API',
            }
        ]
    }))
}
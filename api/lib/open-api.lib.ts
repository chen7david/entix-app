import { AppOpenApi } from "../helpers/types.helpers";
import packageJson from "../../package.json";
import { Scalar } from "@scalar/hono-api-reference";

export const configureOpenApi = (app: AppOpenApi) => {
    app.doc("/api/v1/doc", {
        openapi: "3.1.0",
        info: {
            title: "Entix API",
            version: packageJson.version,
        },
    })

    app.get('/api/v1/api-reference', Scalar({
        url: '/api/v1/doc', theme: 'purple', pageTitle: 'Awesome API', layout: 'classic', defaultHttpClient: {
            targetKey: 'js',
            clientKey: 'fetch',
        }
    }))
}
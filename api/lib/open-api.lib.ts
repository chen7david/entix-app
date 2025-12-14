import { AppOpenApi } from "../helpers/types.helpers";
import packageJson from "../../package.json";
import { Scalar } from "@scalar/hono-api-reference";

export const configureOpenApi = (app: AppOpenApi) => {
    app.doc("/doc", {
        openapi: "3.1.0",
        info: {
            title: "Entix API",
            version: packageJson.version,
        },
    })

    app.get('/client', Scalar({
        url: '/doc', theme: 'purple', pageTitle: 'Awesome API', layout: 'classic', defaultHttpClient: {
            targetKey: 'js',
            clientKey: 'fetch',
        }
    }))
}
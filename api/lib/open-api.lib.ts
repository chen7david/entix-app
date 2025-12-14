import { AppOpenApi } from "../app.type";
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

    app.get('/reference', Scalar({ url: '/doc', theme: 'purple', pageTitle: 'Awesome API', }))
}
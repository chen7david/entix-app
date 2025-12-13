import { AppOpenApi } from "../app.type";
import packageJson from "../../package.json";

export const configureOpenApi = (app: AppOpenApi) => {
    app.doc("/doc", {
        openapi: "3.1.0",
        info: {
            title: "Entix API",
            version: packageJson.version,
        },
    })
}
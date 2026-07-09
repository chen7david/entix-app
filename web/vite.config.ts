import { mergeConfig } from "vite";
import checker from "vite-plugin-checker";
import baseConfig from "./vite.config.base";

export default mergeConfig(baseConfig, {
    plugins: [
        checker({
            typescript: true,
            enableBuild: false,
        }),
    ],
});

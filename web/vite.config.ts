import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import checker from "vite-plugin-checker";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        tsconfigPaths(),
        checker({
            typescript: true,
        }),
    ],
    server: {
        port: 8000,
        fs: {
            allow: [".."],
        },
        proxy: {
            "/api": {
                target: "http://localhost:3000",
                changeOrigin: true,
            },
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (!id.includes("node_modules")) return;
                    if (id.includes("antd")) return "antd";
                    if (id.includes("recharts")) return "recharts";
                    if (id.includes("@vidstack") || id.includes("/vidstack/")) return "vidstack";
                    if (id.includes("@tiptap")) return "tiptap";
                    if (id.includes("@uppy")) return "uppy";
                },
            },
        },
    },
});

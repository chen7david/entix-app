import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
    plugins: [react(), tailwindcss(), tsconfigPaths()],
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
        reportCompressedSize: false,
        sourcemap: false,
        target: "es2022",
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (!id.includes("node_modules")) return;
                    if (id.includes("antd")) return "antd";
                    if (id.includes("recharts")) return "recharts";
                    if (id.includes("@vidstack") || id.includes("/vidstack/")) return "vidstack";
                    if (id.includes("@tiptap")) return "tiptap";
                    if (id.includes("pdfjs-dist")) return "pdfjs";
                    if (id.includes("tesseract.js")) return "tesseract";
                    if (id.includes("country-state-city")) return "geo-data";
                },
            },
        },
    },
});

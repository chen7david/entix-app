import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";

import "./index.css";
import App from "./App.tsx";

import { ThemeProvider } from "./providers/ThemeProvider.tsx";
import { getRequiredElementById } from "./utils/dom.ts";

// Satisfy Biome's zero-! policy by using a safe DOM helper that throws if root is missing.
const rootElement = getRequiredElementById("root");

createRoot(rootElement).render(
    <StrictMode>
        <ThemeProvider>
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </ThemeProvider>
    </StrictMode>
);

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";

import "./index.css";
import App from "./App.tsx";

import { ThemeProvider } from "./providers/ThemeProvider.tsx";
import { getRequiredElementById } from "./utils/dom.ts";

const rootElement = getRequiredElementById("root");
// test 004
createRoot(rootElement).render(
    <StrictMode>
        <ThemeProvider>
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </ThemeProvider>
    </StrictMode>
);

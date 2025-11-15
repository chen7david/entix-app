import "./index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider } from "antd";
import { queryClient } from "./config/react-query.config.ts";
import { antdToken } from "./config/antd.config.ts";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={antdToken}>
        <App />
      </ConfigProvider>
    </QueryClientProvider>
  </StrictMode>
);

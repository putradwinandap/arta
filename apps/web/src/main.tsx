import React from "react";
import ReactDOM from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { AppRouter } from "./AppRouter";
import { AuthGate } from "./AuthGate";
import "./styles.css";

registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthGate>
      <AppRouter />
    </AuthGate>
  </React.StrictMode>,
);

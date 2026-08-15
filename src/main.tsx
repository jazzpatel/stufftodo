import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

console.log("App starting...");
console.log(import.meta.env);
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

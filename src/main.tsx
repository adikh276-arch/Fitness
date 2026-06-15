import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";
import "./lib/i18n"; // Initialize i18n (synchronous, bundled resources)

createRoot(document.getElementById("root")!).render(
  <App />
);
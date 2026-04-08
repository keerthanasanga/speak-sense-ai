import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./config/firebase";
import "./index.css";

// Unregister any stale CRA service workers (they intercept API fetches)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(r => r.unregister());
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
import "material-symbols";
import "remixicon/fonts/remixicon.css";
import "react-calendar/dist/Calendar.css";
import "../node_modules/swiper/swiper-bundle.min.css";
import "cropperjs/dist/cropper.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SweetAlertProvider } from "./modules/SuperAdmin/context/SweetAlertContext.tsx";
import { ToastContainer } from "react-toastify";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import App from "./App.tsx";
import "./index.css";

import { applyTheme } from "./theme/applyTheme";
import { plainUniversalService } from "./services/plainApi";

/* ================= THEME BOOTSTRAP ================= */

async function bootstrapTheme() {
  try {
    const payload = {
      procName: "AppThemeMaster",
      Para: JSON.stringify({
        ActionMode: "GetActive",
      }),
    };

    const response = await plainUniversalService(payload);
    const res = response?.data;

    if (!Array.isArray(res) || res.length === 0) return;

    const row = res[0];
    const themeJson = JSON.parse(row.ThemeJson || "{}");

    const colors: Record<string, string> = {};

    // flatten nested color structure
    Object.entries(themeJson).forEach(([key, value]) => {
      if (typeof value === "object" && value !== null) {
        Object.entries(value).forEach(([shade, color]) => {
          colors[`${key}-${shade}`] = color as string;
        });
      }
    });

    applyTheme({
      mode: themeJson.darkModeDefault ? "dark" : "light",
      font: themeJson.fontBody,
      colors,
    });

  } catch (err) {
    console.warn("Theme load failed, using default theme.");
  }
}

/* ================= APP START ================= */

async function startApp() {
  // Wait for theme BEFORE rendering React
  await bootstrapTheme();

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <SweetAlertProvider>
        <App />
        <ToastContainer
          position="top-right"
          autoClose={4000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
          draggable
          theme="colored"
        />
      </SweetAlertProvider>
    </StrictMode>
  );
}

startApp();

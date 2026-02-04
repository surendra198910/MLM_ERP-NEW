import "material-symbols";
import "remixicon/fonts/remixicon.css";
import "react-calendar/dist/Calendar.css";
import "../node_modules/swiper/swiper-bundle.min.css";
import "cropperjs/dist/cropper.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SweetAlertProvider } from "./modules/SuperAdmin/context/SweetAlertContext.tsx";
import { ToastContainer } from "react-toastify";

import App from "./App.tsx";
import "./index.css";

import ThemeBootstrap from "./theme/ThemeBootstrap";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SweetAlertProvider>
      <ThemeBootstrap>
        <App />
      </ThemeBootstrap>

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

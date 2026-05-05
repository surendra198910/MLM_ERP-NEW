import { applyTheme } from "./applyTheme";
import { plainUniversalService } from "../services/plainApi";
import axios from "axios";

export async function loadTheme() {
  try {
    const themeURL = import.meta.env.VITE_THEME_URL;

        try {
      const response = await axios.post(themeURL, {});
      const res = response?.data;

      if (!Array.isArray(res) || res.length === 0) return;

      const row = res[0];
      const themeJson = JSON.parse(row.ThemeJson || "{}");

      const colors: Record<string, string> = {};

      // 🔥 flatten color structure
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
      console.warn("Theme load failed, default theme used", err);
    }
  }

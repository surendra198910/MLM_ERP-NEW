type ThemeConfig = {
  mode?: "light" | "dark";
  colors?: Record<string, string>;
  font?: string;
};

export function applyTheme(theme: ThemeConfig) {
  const root = document.documentElement;

  /* ================= DARK / LIGHT MODE ================= */
  root.classList.toggle("dark", theme.mode === "dark");

  /* ================= CSS VARIABLES ================= */
  if (theme.colors) {
    Object.entries(theme.colors).forEach(([key, value]) => {
      // primary-500 → --color-primary-500
      root.style.setProperty(`--color-${key}`, value);
    });
  }

  /* ================= FONT ================= */
  if (theme.font) {
    root.style.setProperty("--font-body", theme.font);
    document.body.style.fontFamily = theme.font;
  }

  /* ================= DEBUG ================= */
  console.log("Theme applied:", theme);
}

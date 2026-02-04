import { useEffect, useState } from "react";
import { loadTheme } from "./loadTheme";

export default function ThemeBootstrap({ children }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        await loadTheme();
      } finally {
        setReady(true);
      }
    };

    init();
  }, []);

  if (!ready) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0e19]">
        <div className="theme-loader" />
      </div>
    );
  }

  return children;
}

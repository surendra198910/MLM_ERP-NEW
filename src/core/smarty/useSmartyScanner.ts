import { useEffect } from "react";
import { scanSmartyActions } from "./SmartyActionScanner";
import { SmartyActionStoreInstance } from "./SmartyActionStore";

export const useSmartyScanner = (
  pageName: string,
  deps: any[] = []
) => {
  const isDev = import.meta.env.MODE === "development";
  if (!isDev) return;

  useEffect(() => {
    const timer = setTimeout(() => {
      const actions = scanSmartyActions();
      SmartyActionStoreInstance.set(pageName, actions);

      console.log(`🔍 Smarty scan [${pageName}]`, actions);
    }, 100);

    return () => clearTimeout(timer);
  }, deps);
};

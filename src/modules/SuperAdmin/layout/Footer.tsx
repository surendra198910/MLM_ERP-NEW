import React, { useEffect, useState } from "react";
import { ApiService } from "../../../services/ApiService";


interface PanelSetting {
  FooterData?: string;
}

const Footer: React.FC = () => {
  const { universalService } = ApiService();

  /* --------------------------------------------
     STATE (LocalStorage First)
  --------------------------------------------- */
  const [panelSetting, setPanelSetting] = useState<PanelSetting>(() => {
    try {
      return JSON.parse(localStorage.getItem("PanelSetting") || "{}");
    } catch {
      return {};
    }
  });

  /* --------------------------------------------
     LOAD FROM API (SOURCE OF TRUTH)
  --------------------------------------------- */
  useEffect(() => {
    const loadFooterSetting = async () => {
      try {
        const res = await universalService({
          procName: "PanelSetting",
          Para: JSON.stringify({ ActionMode: "GET_GLOBAL" }),
        });

        const data = res?.data?.[0] || res?.[0];
        if (!data) return;

        // Save globally
        localStorage.setItem("PanelSetting", JSON.stringify(data));

        // Update footer immediately
        setPanelSetting(data);
      } catch (err) {
        console.error("Footer setting load failed", err);
      }
    };

    loadFooterSetting();
  }, []);

  /* --------------------------------------------
     LISTEN FOR GLOBAL PANEL UPDATES
  --------------------------------------------- */
  useEffect(() => {
    const onPanelUpdate = () => {
      try {
        const stored = localStorage.getItem("PanelSetting");
        if (stored) {
          setPanelSetting(JSON.parse(stored));
        }
      } catch {
        /* silent */
      }
    };

    window.addEventListener("panel-theme-updated", onPanelUpdate);
    return () =>
      window.removeEventListener("panel-theme-updated", onPanelUpdate);
  }, []);

  /* --------------------------------------------
     FOOTER CONTENT
  --------------------------------------------- */
  const footerText =
    panelSetting?.FooterData ||
    "© Trezo is Proudly Owned by EnvyTheme";

  /* --------------------------------------------
     RENDER
  --------------------------------------------- */
  return (
    <>
      <div className="grow" />

      <footer
        className="
          rounded-t-md px-[20px] md:px-[25px] py-[15px] md:py-[20px] text-center
          bg-white text-gray-700
          dark:bg-[#0c1427] dark:text-gray-300
        "
      >
        <p
          className="text-sm"
          dangerouslySetInnerHTML={{ __html: footerText }}
        />
      </footer>
    </>
  );
};

export default Footer;

import React, { useState, useEffect } from "react";

const DarkMode: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  useEffect(() => {
    const storedPreference = localStorage.getItem("theme");
    if (storedPreference === "dark") {
      setIsDarkMode(true);
    }
  }, []);

  const handleToggle = () => {
    setIsDarkMode(!isDarkMode);
  };

  useEffect(() => {
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");

    const htmlElement = document.querySelector("html");
    if (htmlElement) {
      isDarkMode
        ? htmlElement.classList.add("dark")
        : htmlElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  return (
    <div className="relative group mx-[8px] md:mx-[10px] lg:mx-[12px] inline-block">
      <button
        type="button"
        onClick={handleToggle}
        className="light-dark-toggle leading-none inline-block
                   transition-all relative top-[2px]
                   text-[#fe7a36] hover:text-primary-500"
      >
        <i className="material-symbols-outlined !text-[20px] md:!text-[22px]">
          {isDarkMode ? "dark_mode" : "light_mode"}
        </i>
      </button>

      {/* TOOLTIP */}
      <div
        className="absolute left-1/2 -translate-x-1/2 -bottom-[38px]
                   px-2 py-1 text-xs rounded
                   bg-gray-800 text-white
                   opacity-0 group-hover:opacity-100
                   transition-opacity
                   whitespace-nowrap
                   pointer-events-none"
      >
        {isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}

        {/* ARROW */}
        <div
          className="absolute -top-1 left-1/2 -translate-x-1/2
                     w-0 h-0
                     border-l-4 border-r-4 border-b-4
                     border-l-transparent
                     border-r-transparent
                     border-b-gray-800"
        />
      </div>
    </div>
  );
};

export default DarkMode;

import { useState, useRef, useEffect } from "react";
import RTLMode from "./RTLMode";

export default function Settings() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const toggleDropdown = () => {
    setIsOpen((p) => !p);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative group mx-[8px] md:mx-[10px] lg:mx-[12px]">
      {/* ⚙ SETTINGS ICON */}
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleDropdown}
        className="leading-none inline-block transition-all
                   relative top-[2px]
                   hover:text-primary-500"
      >
        <i className="material-symbols-outlined !text-[22px] md:!text-[24px]">
          settings
        </i>
      </button>

      {/* 🧾 TOOLTIP */}
      <div
        className="absolute left-1/2 -translate-x-1/2 -bottom-[38px]
                   px-2 py-1 text-xs rounded
                   bg-gray-800 text-white
                   opacity-0 group-hover:opacity-100
                   transition-opacity
                   whitespace-nowrap
                   pointer-events-none"
      >
        Settings
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

      {/* 🔽 DROPDOWN */}
      <div
        ref={dropdownRef}
        className={`${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        } transition-all`}
      >
        <div
          className="bg-white dark:bg-[#0c1427]
                        shadow-3xl dark:shadow-none
                        p-[20px]
                        absolute mt-[17px] md:mt-[20px]
                        w-[195px]
                        z-[1]
                        top-full ltr:right-0 rtl:left-0
                        rounded-md"
        >
          <RTLMode />
        </div>
      </div>
    </div>
  );
}

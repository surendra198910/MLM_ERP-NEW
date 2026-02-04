import React, { useState, useEffect, useRef } from "react";

type Language = {
  name: string;
  code: string;
  flag: string;
};

const languages: Language[] = [
  { name: "English", code: "en", flag: "/images/flags/usa.svg" },
  { name: "French", code: "fr", flag: "/images/flags/france.svg" },
  { name: "German", code: "de", flag: "/images/flags/germany.svg" },
  { name: "Portuguese", code: "pt", flag: "/images/flags/portugal.svg" },
  { name: "Spanish", code: "es", flag: "/images/flags/spain.svg" },
];

const ChooseLanguage: React.FC = () => {
  const [active, setActive] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleDropdownToggle = () => {
    setActive((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setActive(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLanguageChange = (code: string) => {
    console.log(`Selected language: ${code}`);
  };

  return (
    <div
      ref={dropdownRef}
      className="relative mx-[8px] md:mx-[10px] lg:mx-[12px]"
    >
      {/* ICON + TOOLTIP */}
      <div className="relative group inline-block">
        <button
          type="button"
          onClick={handleDropdownToggle}
          className={`leading-none pr-[12px]
                     inline-block transition-all
                     relative top-[2px]
                     hover:text-primary-500 ${
                       active ? "text-primary-500" : ""
                     }`}
        >
          <i className="material-symbols-outlined !text-[20px] md:!text-[22px]">
            translate
          </i>
          <i className="ri-arrow-down-s-line text-[15px]
                        absolute -right-[3px]
                        top-1/2 -translate-y-1/2 -mt-[2px]" />
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
          Change Language

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

      {/* DROPDOWN */}
      {active && (
        <div className="language-menu-dropdown bg-white dark:bg-[#0c1427]
                        shadow-3xl pt-[13px]
                        absolute mt-[18px]
                        w-[200px] md:w-[240px]
                        z-[50]
                        top-full right-0 rounded-md">
          <span className="block font-semibold px-[20px] pb-[14px] text-sm">
            Choose Language
          </span>

          <ul>
            {languages.map((language) => (
              <li
                key={language.code}
                className="border-t border-dashed
                           border-gray-100 dark:border-[#172036]"
              >
                <button
                  type="button"
                  onClick={() => handleLanguageChange(language.code)}
                  className="w-full px-[20px] py-[12px]
                             text-left hover:bg-gray-100
                             dark:hover:bg-[#172036]"
                >
                  <div className="flex items-center">
                    <img
                      src={language.flag}
                      className="mr-[10px]"
                      alt={language.name}
                      width={30}
                      height={30}
                    />
                    {language.name}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ChooseLanguage;

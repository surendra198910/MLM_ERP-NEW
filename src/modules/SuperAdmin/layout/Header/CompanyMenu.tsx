import React, { useEffect, useRef, useState } from "react";

const CompanyMenu: React.FC = () => {
  const [active, setActive] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleDropdownToggle = () => {
    setActive((prev) => !prev);
  };

  /* ===============================
     OUTSIDE CLICK
  =============================== */
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

  return (
    <div
      ref={dropdownRef}
      className="relative mx-[8px] md:mx-[10px] lg:mx-[12px]
                 ltr:first:ml-0 ltr:last:mr-0
                 rtl:first:mr-0 rtl:last:ml-0"
    >
      {/* ===============================
          BUTTON (SAME AS PROFILE)
      =============================== */}
      <button
        type="button"
        onClick={handleDropdownToggle}
        className={`flex items-center -mx-[5px] relative
                    ltr:pr-[14px] rtl:pl-[14px]
                    text-black dark:text-white
                    transition-all ${active ? "active" : ""}`}
      >
        <img
          src="/images/company-logo.png"
          className="w-[35px] h-[35px] md:w-[42px] md:h-[42px]
                     rounded-md
                     ltr:md:mr-[2px] ltr:lg:mr-[8px]
                     rtl:md:ml-[2px] rtl:lg:ml-[8px]
                     border-[2px] border-primary-200 inline-block"
          alt="company-logo"
        />

        <span className="block font-semibold text-[0px] lg:text-base whitespace-nowrap">
          {localStorage.getItem("CompanyName") ||
            "Nobility Business Services Pvt Ltd"}
        </span>

        <i className="ri-arrow-down-s-line text-[15px]
                      absolute ltr:-right-[3px] rtl:-left-[3px]
                      top-1/2 -translate-y-1/2 mt-px" />
      </button>

      {/* ===============================
          DROPDOWN (PROFILE-LIKE)
      =============================== */}
      {active && (
        <div
          className="profile-menu-dropdown
                     bg-white dark:bg-[#0c1427]
                     transition-all shadow-3xl dark:shadow-none
                     py-[22px]
                     absolute mt-[13px] md:mt-[14px]
                     w-[220px]
                     z-[1]
                     top-full
                     ltr:right-0 rtl:left-0
                     rounded-md"
        >
          {/* Header */}
          <div className="flex items-center border-b
                          border-gray-100 dark:border-[#172036]
                          pb-[12px] mx-[20px] mb-[10px]">
            <img
              src="/images/company-logo.png"
              className="rounded-md w-[31px] h-[31px]
                         ltr:mr-[9px] rtl:ml-[9px]
                         border-2 border-primary-200 inline-block"
              alt="company-logo"
            />
            <div>
              <span className="block text-black dark:text-white font-medium">
                Nobility Business Services
              </span>
              <span className="block text-xs">Head Office</span>
            </div>
          </div>

          {/* Body */}
          <ul>
            <li className="px-[20px] py-[6px] text-sm text-gray-500">
              • Switch Company
            </li>
            <li className="px-[20px] py-[6px] text-sm text-gray-500">
              • Company Settings
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default CompanyMenu;

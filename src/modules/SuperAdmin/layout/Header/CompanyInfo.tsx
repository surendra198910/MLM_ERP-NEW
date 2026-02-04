import React, { useEffect, useRef, useState } from "react";

/* ====================================================
   TYPES (MATCH STORAGE STRUCTURE)
==================================================== */
interface EmployeeInfo {
  FirstName?: string;
  LastName?: string;
  EmailId?: string;
  DesignationName?: string;
  CompanyName?: string;
  CompanyLogo?: string;
  FinancialYear?: string;
}

/* ====================================================
   ENV
==================================================== */
const IMAGE_PREVIEW_URL = import.meta.env.VITE_IMAGE_PREVIEW_URL;

const CompanyInfo: React.FC = () => {
  const [active, setActive] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [employee, setEmployee] = useState<EmployeeInfo>({});

  /* ====================================================
     CORRECT LOCAL STORAGE READ
     (EmployeeDetails IS THE EMPLOYEE OBJECT)
==================================================== */
  useEffect(() => {
    try {
      const raw = localStorage.getItem("EmployeeDetails");
      if (!raw) return;

      const parsed: EmployeeInfo = JSON.parse(raw);
      setEmployee(parsed);
    } catch (err) {
      console.error("Invalid EmployeeDetails JSON", err);
    }
  }, []);

  /* ====================================================
     CLOSE ON OUTSIDE HOVER
==================================================== */
  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setActive(false);
      }
    };

    document.addEventListener("mousemove", handleOutside);
    return () => document.removeEventListener("mousemove", handleOutside);
  }, []);

  /* ====================================================
     COMPANY LOGO (FROM EMPLOYEE)
==================================================== */
  const logoUrl =
 `${IMAGE_PREVIEW_URL}${employee.CompanyLogo}`
  

  const fullName = `${employee.FirstName || ""} ${
    employee.LastName || ""
  }`.trim();

  /* ====================================================
     UI
==================================================== */
  return (
    <div
      ref={dropdownRef}
      className="relative mx-[8px] md:mx-[10px] lg:mx-[12px] cursor-pointer"
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
    >
      {/* ================= HEADER VIEW ================= */}
      <div className="flex items-center -mx-[5px] relative ltr:pr-[14px] rtl:pl-[14px] text-black dark:text-white">
        <img
          src={logoUrl}
          alt="company-logo"
          className="w-[35px] h-[35px] md:w-[42px] md:h-[42px]
                     rounded-full object-cover bg-white
                     border-[2px] border-primary-200
                     ltr:md:mr-[6px]"
        />

        <span className="hidden lg:block font-semibold text-sm max-w-[220px] truncate">
          {employee.CompanyName || "Company"}
        </span>

        <i className="ri-arrow-down-s-line text-[15px]
                      absolute ltr:-right-[3px] rtl:-left-[3px]
                      top-1/2 -translate-y-1/2 mt-px" />
      </div>

      {/* ================= DROPDOWN ================= */}
      {active && (
        <div
          className="
            bg-white dark:bg-[#0c1427]
            shadow-3xl dark:shadow-none
            py-[18px]
            absolute mt-[13px]
            w-[260px]
            z-[1]
            top-full ltr:right-0 rtl:left-0
            rounded-md
          "
        >
          {/* HEADER */}
          <div className="flex items-center border-b border-gray-100 dark:border-[#172036]
                          pb-[12px] mx-[20px] mb-[10px]">
            <img
              src={logoUrl}
              alt="company-logo"
              className="rounded-md w-[42px] h-[42px]
                         object-cover border-2 border-primary-200
                         ltr:mr-[10px]"
            />
            <div>
              <span className="block text-black dark:text-white font-medium text-sm">
                {employee.CompanyName}
              </span>
              <span className="block text-xs text-gray-500">
                FY {employee.FinancialYear}
              </span>
            </div>
          </div>

          {/* DETAILS */}
          <ul className="px-[20px] space-y-[8px] text-sm">
            <li className="flex items-center gap-2 text-black dark:text-white">
              <i className="material-symbols-outlined !text-[18px] text-primary-500">
                person
              </i>
              {fullName || "-"}
            </li>

            <li className="flex items-center gap-2 text-black dark:text-white">
              <i className="material-symbols-outlined !text-[18px] text-primary-500">
                badge
              </i>
              {employee.DesignationName || "-"}
            </li>

            <li className="flex items-center gap-2 text-black dark:text-white break-all">
              <i className="material-symbols-outlined !text-[18px] text-primary-500">
                mail
              </i>
              {employee.EmailId || "-"}
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default CompanyInfo;

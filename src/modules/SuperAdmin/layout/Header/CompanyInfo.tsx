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
const IMAGE_PREVIEW_URL = import.meta.env.VITE_IMAGE_PREVIEW_URL_2;

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
 `${IMAGE_PREVIEW_URL}CompanyDocs/${employee.CompanyLogo}`
  

  const fullName = `${employee.FirstName || ""} ${
    employee.LastName || ""
  }`.trim();

  /* ====================================================
     UI
==================================================== */
  return (
    <div
      ref={dropdownRef}
      className="relative mx-[8px] md:mx-[10px] lg:mx-[12px]"
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

      </div>

    
    </div>
  );
};

export default CompanyInfo;

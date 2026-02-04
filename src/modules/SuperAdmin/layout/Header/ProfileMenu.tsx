import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

/* ====================================================
   TYPES
==================================================== */
interface EmployeeInfo {
  FirstName?: string;
  LastName?: string;
  EmailId?: string;
  DesignationName?: string;
  ProfilePic?: string;
}

/* ====================================================
   ENV
==================================================== */
const IMAGE_PREVIEW_URL = import.meta.env.VITE_IMAGE_PREVIEW_URL;

const ProfileMenu: React.FC = () => {
  const { pathname } = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [active, setActive] = useState(false);
  const [employee, setEmployee] = useState<EmployeeInfo>({});

  /* ====================================================
     LOAD EMPLOYEE FROM LOCAL STORAGE
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
     CLOSE ON OUTSIDE CLICK
==================================================== */
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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ====================================================
     HELPERS
==================================================== */
  const fullName = `${employee.FirstName || ""} ${
    employee.LastName || ""
  }`.trim();

  const profileImage =
    employee.ProfilePic && IMAGE_PREVIEW_URL
      ? `${IMAGE_PREVIEW_URL}${employee.ProfilePic.split("|")[0]}`
      : "/images/admin.png";

  /* ====================================================
     UI
==================================================== */
  return (
    <div
      ref={dropdownRef}
      className="relative group mx-[8px] md:mx-[10px] lg:mx-[12px]"
    >
      {/* ================= BUTTON ================= */}
      <button
        type="button"
        onClick={() => setActive((prev) => !prev)}
        className="flex items-center -mx-[5px] relative
                   ltr:pr-[14px] rtl:pl-[14px]
                   text-black dark:text-white"
      >
        <img
          src={profileImage}
          alt="profile"
          className="w-[35px] h-[35px] md:w-[42px] md:h-[42px]
                     rounded-full border-[2px] border-primary-200
                     object-cover ltr:md:mr-[6px]"
        />

        <span className="hidden lg:block font-semibold text-sm max-w-[140px] truncate">
          {fullName || "User"}
        </span>

        <i
          className="ri-arrow-down-s-line text-[15px]
                      absolute ltr:-right-[3px] rtl:-left-[3px]
                      top-1/2 -translate-y-1/2 mt-px"
        />
      </button>

      {/* 🧾 TOOLTIP */}
      <div
        className="absolute left-1/2 -translate-x-1/2 -bottom-[32px]
                   px-2 py-1 text-xs rounded
                   bg-gray-800 text-white
                   opacity-0 group-hover:opacity-100
                   transition-opacity
                   whitespace-nowrap
                   pointer-events-none"
      >
        Profile
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

      {/* ================= POPUP ================= */}
      {active && (
        <div
          className="bg-white dark:bg-[#0c1427]
                     shadow-3xl dark:shadow-none
                     py-[20px]
                     absolute mt-[12px]
                     w-[260px]
                     z-[50]
                     top-full ltr:right-0 rtl:left-0
                     rounded-md"
        >
          {/* HEADER */}
          <div
            className="flex items-center border-b border-gray-100 dark:border-[#172036]
                          pb-[14px] mx-[20px] mb-[12px]"
          >
            <img
              src={profileImage}
              alt="profile"
              className="rounded-full w-[40px] h-[40px]
                         border-2 border-primary-200 object-cover
                         ltr:mr-[10px]"
            />
            <div>
              <span className="block text-black dark:text-white font-medium text-sm">
                {fullName}
              </span>
              <span className="block text-xs text-gray-500">
                {employee.DesignationName}
              </span>
              <span className="block text-xs text-gray-500 truncate max-w-[180px]">
                {employee.EmailId}
              </span>
            </div>
          </div>

          {/* MENU */}
          <ul>
            <li>
              <Link
                to="/my-profile"
                className={`block relative py-[8px]
                            ltr:pl-[50px] ltr:pr-[20px]
                            transition-all hover:text-primary-500
                            ${
                              pathname === "/my-profile"
                                ? "text-primary-500"
                                : "text-black dark:text-white"
                            }`}
              >
                <i
                  className="material-symbols-outlined absolute ltr:left-[20px]
                               top-1/2 -translate-y-1/2 !text-[22px]"
                >
                  account_circle
                </i>
                My Profile
              </Link>
            </li>

            <li>
              <Link
                to="/apps/support-tickets"
                className="block relative py-[8px]
                           ltr:pl-[50px] ltr:pr-[20px]
                           text-black dark:text-white
                           hover:text-primary-500"
              >
                <i
                  className="material-symbols-outlined absolute ltr:left-[20px]
                               top-1/2 -translate-y-1/2 !text-[22px]"
                >
                  support
                </i>
                My Support Tickets
              </Link>
            </li>

            <li>
              <Link
                to="/apps/to-do-list"
                className="block relative py-[8px]
                           ltr:pl-[50px] ltr:pr-[20px]
                           text-black dark:text-white
                           hover:text-primary-500"
              >
                <i
                  className="material-symbols-outlined absolute ltr:left-[20px]
                               top-1/2 -translate-y-1/2 !text-[22px]"
                >
                  format_list_bulleted
                </i>
                My Tasks
              </Link>
            </li>

            <li>
              <Link
                to="/change-password"
                className="block relative py-[8px]
                           ltr:pl-[50px] ltr:pr-[20px]
                           text-black dark:text-white
                           hover:text-primary-500"
              >
                <i
                  className="material-symbols-outlined absolute ltr:left-[20px]
                               top-1/2 -translate-y-1/2 !text-[22px]"
                >
                  lock
                </i>
                Change Password
              </Link>
            </li>
          </ul>

          <div
            className="border-t border-gray-100 dark:border-[#172036]
                          mx-[20px] my-[10px]"
          />

          <ul>
            <li>
              <a
                href="/authentication/logout"
                className="block relative py-[8px]
                           ltr:pl-[50px] ltr:pr-[20px]
                           text-red-500 hover:text-red-600"
              >
                <i
                  className="material-symbols-outlined absolute ltr:left-[20px]
                               top-1/2 -translate-y-1/2 !text-[22px]"
                >
                  logout
                </i>
                Logout
              </a>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;

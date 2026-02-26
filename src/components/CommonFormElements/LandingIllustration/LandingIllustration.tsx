"use client";

import React from "react";
import PermissionAwareTooltip from "../../../modules/SuperAdmin/components/Tooltip/PermissionAwareTooltip";
import { SmartActions } from "../../../modules/SuperAdmin/components/Security/SmartActionWithFormName";

type Props = {
  title: string;
  description?: React.ReactNode;
  formName?: string;
  addLabel?: string;
  onAdd?: () => void;
};

const LandingIllustration: React.FC<Props> = ({
  title,
  description,
  formName,
  addLabel = "Add New",
  onAdd,
}) => {
  return (
    <div
      className="w-full bg-white dark:bg-[#0c1427] rounded-md border border-gray-200 
      dark:border-[#172036] p-10 flex flex-col md:flex-row items-center 
      md:items-start justify-center md:gap-x-80 min-h-[450px]"
    >
      {/* LEFT */}
      {/* LEFT */}
      <div className="md:max-w-md md:px-3 px-0 py-14">
        

        {/* DESCRIPTION */}
        <div className="text-gray-600 dark:text-gray-300 leading-relaxed mb-8 mt-15 text-[15px] space-y-2">
          {/* TITLE */}
        <h1 className="text-3xl font-semibold text-black dark:text-white mb-4 leading-tight">
          {title}
        </h1>
          {description ? (
            description
          ) : (
            <>
              <p>Use the filters above to search, edit or manage records.</p>
              <p className="font-medium text-gray-700 dark:text-gray-200">OR</p>
              <p>Create a new record using the button below.</p>
            </>
          )}
        </div>

        {/* ADD BUTTON */}
        {onAdd && formName && (
          <PermissionAwareTooltip
            allowed={SmartActions.canAdd(formName)}
            allowedText="Add New"
          >
            <button
              type="button"
              disabled={!SmartActions.canAdd(formName)}
              onClick={() => {
                if (!SmartActions.canAdd(formName)) return;
                onAdd();
              }}
              className={`px-[26.5px] py-[12px] rounded-md font-medium transition-all
        ${SmartActions.canAdd(formName)
                  ? "bg-primary-button-bg text-white hover:bg-primary-button-bg-hover shadow-sm"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
            >
              {addLabel}
            </button>
          </PermissionAwareTooltip>
        )}
      </div>

      {/* RIGHT SVG */}
      <div className="hidden md:flex">
        <svg
          viewBox="0 0 512 512"
          className="w-[320px] h-auto select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="40"
            y="80"
            width="432"
            height="340"
            rx="30"
            className="fill-primary-button-bg"
          />

          <path
            d="M70 80H442C458.569 80 472 93.4315 472 110V130H40V110C40 93.4315 53.4315 80 70 80Z"
            className="fill-primary-200"
          />

          <g className="fill-primary-200">
            <rect x="90" y="210" width="25" height="25" rx="6" />
            <rect x="140" y="210" width="240" height="15" rx="7.5" />

            <rect x="90" y="265" width="25" height="25" rx="6" />
            <rect x="140" y="265" width="240" height="15" rx="7.5" />

            <rect x="90" y="320" width="25" height="25" rx="6" />
            <rect x="140" y="320" width="240" height="15" rx="7.5" />
          </g>

          <rect
            x="430"
            y="420"
            width="20"
            height="80"
            rx="5"
            transform="rotate(-45 430 420)"
            className="fill-primary-button-bg-hover"
          />

          <circle
            cx="380"
            cy="380"
            r="90"
            className="fill-primary-50 stroke-primary-200"
            strokeWidth="8"
          />
        </svg>
      </div>
    </div>
  );
};

export default LandingIllustration;
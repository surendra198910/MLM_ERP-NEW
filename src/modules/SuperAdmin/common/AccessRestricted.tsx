import React from "react";

const AccessRestricted: React.FC = () => {
  return (
    <div
      className="w-full bg-white dark:bg-[#0c1427] rounded-md border border-gray-200 
                 dark:border-[#172036] p-25 flex flex-col md:flex-row 
                 items-center md:items-start justify-center md:gap-x-40 min-h-[450px]"
    >
      {/* LEFT SECTION */}
      <div className="md:max-w-md md:px-3 px-0 py-14">
        <h1 className="text-3xl font-semibold text-black dark:text-white mb-4">
          Access Restricted
        </h1>

        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6 text-[15px]">
          You do not have the necessary permissions to view this module.
          <br />
          Please contact your administrator to request access
          <br />
          or switch to an authorized account.
        </p>
      </div>

      {/* RIGHT ILLUSTRATION */}
      <div className="hidden md:flex">
        <svg
          viewBox="0 0 512 512"
          className="w-[320px] h-auto opacity-100 select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Main Shield */}
          <path
            d="M256 40C150 40 60 80 60 180C60 300 256 472 256 472C256 472 452 300 452 180C452 80 362 40 256 40Z"
            className="fill-primary-button-bg"
          />

          {/* Inner Highlight */}
          <path
            d="M256 75C185 75 105 105 105 180C105 265 256 405 256 405C256 405 407 265 407 180C407 105 327 75 256 75Z"
            className="fill-primary-button-bg-hover"
          />

          {/* Lock Body */}
          <rect
            x="186"
            y="215"
            width="140"
            height="105"
            rx="12"
            className="fill-white"
          />

          {/* Lock Shackle */}
          <path
            d="M210 215V175C210 149.5 230.5 129 256 129C281.5 129 302 149.5 302 175V215"
            fill="none"
            stroke="white"
            strokeWidth="22"
            strokeLinecap="round"
          />

          {/* Keyhole */}
          <circle
            cx="256"
            cy="265"
            r="10"
            className="fill-primary-button-bg"
          />
          <path
            d="M251 270L261 270L264 290L248 290Z"
            className="fill-primary-button-bg"
          />
        </svg>
      </div>
    </div>
  );
};

export default AccessRestricted;

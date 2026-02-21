import React from "react";

const OopsNoData: React.FC = () => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-center p-10 gap-10 min-h-[300px] animate-in fade-in zoom-in duration-300">

      {/* TEXT */}
      <div className="text-center md:text-left max-w-md">
        <h3 className="text-xl font-bold text-primary-button-bg mb-1">
          Oops!
        </h3>

        <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white mb-4">
          No Records Found!
        </h2>

        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
          Please adjust the data filter and search again.
        </p>
      </div>

      {/* ILLUSTRATION */}
      <div className="flex-shrink-0">
        <svg
          viewBox="0 0 512 512"
          className="w-[320px] h-auto select-none"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
        >
          <path d="M96 220L256 300L416 220" className="stroke-primary-button-bg" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M96 220L150 160L256 200" className="stroke-primary-button-bg" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M416 220L362 160L256 200" className="stroke-primary-button-bg" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M96 220V340C96 360 112 376 132 376H380C400 376 416 360 416 340V220" className="stroke-primary-button-bg" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M150 220L256 260L362 220L256 190L150 220Z" className="fill-primary-button-bg" />
        </svg>
      </div>
    </div>
  );
};

export default OopsNoData;
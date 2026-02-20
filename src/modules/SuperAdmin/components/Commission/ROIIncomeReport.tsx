import React, { useState } from "react";

const Template: React.FC = () => {
  const [searchInput, setSearchInput] = useState("");
  const [filterColumn, setFilterColumn] = useState("__NONE__");
  const [showTable, setShowTable] = useState(false); // Toggle to show 'Oops' or 'Welcome'

  const applySearch = () => {
    // Dummy trigger to show the "No Records" state
    setShowTable(true);
  };

  const resetSearch = () => {
    setShowTable(false);
    setSearchInput("");
    setFilterColumn("__NONE__");
  };

  return (
    <div className="trezo-card bg-white dark:bg-[#0c1427] mb-[25px] p-[20px] md:p-[25px] rounded-md">
      {/* --- HEADER & SEARCH SECTION --- */}
      <div className="trezo-card-header mb-[10px] md:mb-[10px] sm:flex items-center justify-between pb-5 border-b border-gray-200 -mx-[20px] md:-mx-[25px] px-[20px] md:px-[25px]">
        <div className="trezo-card-title">
          <h5 className="!mb-0 font-bold text-xl text-black dark:text-white">Manage Template</h5>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 sm:w-auto w-full">
          <div className="flex flex-col sm:flex-row items-center gap-3 flex-wrap justify-end">
            
            {/* 1. Filter Dropdown (Exactly from your design) */}
            <div className="relative w-full sm:w-[180px]">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-gray-500">
                <i className="material-symbols-outlined !text-[18px]">filter_list</i>
              </span>
              <select
                value={filterColumn}
                onChange={(e) => setFilterColumn(e.target.value)}
                className="w-full h-[34px] pl-8 pr-8 text-xs rounded-md appearance-none outline-none border border-gray-300 dark:border-[#172036] bg-white dark:bg-[#0c1427] text-black dark:text-white transition-all focus:border-primary-button-bg"
              >
                <option value="__NONE__">Select Filter Option</option>
                <option value="TemplateName">Template Name</option>
              </select>
              <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-gray-400">
                <i className="material-symbols-outlined !text-[18px]">expand_more</i>
              </span>
            </div>

            {/* 2. Search Input (Exactly from your design) */}
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-gray-500">
                <i className="material-symbols-outlined !text-[18px]">search</i>
              </span>
              <input
                type="text"
                value={searchInput}
                placeholder="Enter Criteria..."
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applySearch()}
                className="h-[34px] w-full pl-8 pr-3 text-xs rounded-md outline-none border border-gray-300 dark:border-[#172036] bg-white dark:bg-[#0c1427] text-black dark:text-white focus:border-primary-button-bg transition-all"
              />
            </div>

            {/* 3. BUTTONS GROUP (Exactly from your design) */}
            <div className="flex items-center gap-2">
              {/* SEARCH BUTTON */}
              <button
                type="button"
                onClick={applySearch}
                className="w-[34px] h-[34px] flex items-center justify-center rounded-md border border-primary-button-bg text-primary-button-bg hover:bg-primary-button-bg hover:text-white transition-all shadow-sm"
              >
                <i className="material-symbols-outlined text-[20px]">search</i>
              </button>

              {/* COLUMN SELECTOR BUTTON */}
              <button
                type="button"
                className="w-[34px] h-[34px] flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 text-gray-500 hover:bg-gray-100 transition-all"
              >
                <i className="material-symbols-outlined text-[20px]">view_column</i>
              </button>

              {/* ADD BUTTON */}
              <button
                type="button"
                className="w-[34px] h-[34px] flex items-center justify-center rounded-md border border-white text-white bg-primary-button-bg hover:bg-white hover:border-primary-button-bg hover:text-primary-button-bg transition-all shadow-sm"
              >
                <i className="material-symbols-outlined text-[20px]">add</i>
              </button>

              {/* REFRESH BUTTON (Visible when showTable is true) */}
              {showTable && (
                <button
                  type="button"
                  onClick={resetSearch}
                  className="w-[34px] h-[34px] flex items-center justify-center rounded-md border border-gray-400 text-gray-500 hover:bg-gray-100 transition-all"
                >
                  <i className="material-symbols-outlined text-[20px]">refresh</i>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- CONTENT CONTAINER --- */}
      <div className="min-h-[500px] flex items-center justify-center">
        {!showTable ? (
          /* STATE 1: INITIAL WELCOME */
          <div className="text-center animate-in fade-in duration-700">
            <div className="mb-6 flex justify-center">
              <svg viewBox="0 0 512 512" className="w-[280px] h-auto select-none" xmlns="http://www.w3.org/2000/svg">
                <rect x="40" y="80" width="432" height="340" rx="30" className="fill-primary-button-bg" />
                <path d="M70 80H442C458 80 472 93 472 110V130H40V110C40 93 53 80 70 80Z" className="fill-primary-200" />
                <g className="fill-primary-200">
                  <rect x="90" y="210" width="25" height="25" rx="6" />
                  <rect x="140" y="210" width="240" height="15" rx="7.5" />
                  <rect x="90" y="265" width="25" height="25" rx="6" />
                  <rect x="140" y="265" width="240" height="15" rx="7.5" />
                </g>
                <circle cx="380" cy="380" r="90" className="fill-primary-50 stroke-primary-200" strokeWidth="8" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-700 dark:text-white">Ready to explore?</h2>
            <p className="text-gray-500 mt-2">Use the filters above to find Template records.</p>
          </div>
        ) : (
          /* STATE 2: OOPS / NO DATA */
          <div className="flex flex-col md:flex-row items-center justify-center p-10 gap-10 min-h-[300px] animate-in fade-in zoom-in duration-300">
            <div className="text-center md:text-left max-w-md">
              <h3 className="text-xl font-bold text-purple-600 mb-1">Oops!</h3>
              <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white mb-4">No Records Found!</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6">
                We couldn't find any templates matching "{searchInput}". Please adjust your criteria and search again.
              </p>
              <button onClick={resetSearch} className="text-primary-button-bg font-semibold hover:underline flex items-center gap-1">
                <i className="material-symbols-outlined text-[18px]">refresh</i>
                Clear Search
              </button>
            </div>

            <div className="flex-shrink-0">
              <svg viewBox="0 0 512 512" className="w-[320px] h-auto select-none" xmlns="http://www.w3.org/2000/svg" fill="none">
                <path d="M96 220L256 300L416 220" className="stroke-primary-button-bg" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M96 220L150 160L256 200" className="stroke-primary-button-bg" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M416 220L362 160L256 200" className="stroke-primary-button-bg" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M96 220V340C96 360 112 376 132 376H380C400 376 416 360 416 340V220" className="stroke-primary-button-bg" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M150 220L256 260L362 220L256 190L150 220Z" className="fill-primary-button-bg" />
                <path d="M256 110C300 90 340 110 340 140C340 165 300 175 256 200" className="stroke-primary-button-bg" strokeWidth="8" strokeLinecap="round" strokeDasharray="12 14" />
                <circle cx="256" cy="90" r="26" className="stroke-primary-button-bg fill-primary-50" strokeWidth="6" />
                <path d="M245 92H268C268 78 245 78 245 92C245 106 268 106 268 92" className="stroke-primary-button-bg-hover" strokeWidth="5" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Template;
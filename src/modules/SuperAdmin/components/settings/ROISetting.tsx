import React, { useState } from "react";
// Define the data structure for creators
interface Creator {
  id: number;
  banner: string;
  avatar: string;
  name: string;
  items: number;
  isFollowing: boolean;
}

// Initial data for creators
const initialCreators: Creator[] = [
  {
    id: 1,
    banner: "/images/nfts/creator1.jpg",
    avatar: "/images/nfts/user.gif",
    name: "Hunny Bunny",
    items: 3204,
    isFollowing: false,
  },
  {
    id: 2,
    banner: "/images/nfts/creator2.jpg",
    avatar: "/images/nfts/user.gif",
    name: "Aristocrat",
    items: 5301,
    isFollowing: false,
  },
];
const Template: React.FC = () => {
  const [creators, setCreators] = useState<Creator[]>(initialCreators); // Manage creators state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Calculate the current creators to display
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCreators = creators.slice(indexOfFirstItem, indexOfLastItem);
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
          <h5 className="!mb-0 font-bold text-xl text-black dark:text-white">
            Manage Template
          </h5>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 sm:w-auto w-full">
          <div className="flex flex-col sm:flex-row items-center gap-3 flex-wrap justify-end">
            {/* 1. Filter Dropdown (Exactly from your design) */}
            <div className="relative w-full sm:w-[180px]">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-gray-500">
                <i className="material-symbols-outlined !text-[18px]">
                  filter_list
                </i>
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
                <i className="material-symbols-outlined !text-[18px]">
                  expand_more
                </i>
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
                <i className="material-symbols-outlined text-[20px]">
                  view_column
                </i>
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
                  <i className="material-symbols-outlined text-[20px]">
                    refresh
                  </i>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- CONTENT CONTAINER --- */}
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="trezo-card mb-[25px]">
          <div className="trezo-card-content">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-[25px]">
              {currentCreators.map((creator) => (
                <div
                  key={creator.id}
                  className="bg-white dark:bg-[#0c1427] rounded-2xl shadow-[2px_0px_11px_0px_#e7e5e5] border border-gray-100 overflow-hidden"
                >
                  {/* Header */}
                  <div className="relative bg-gradient-to-b from-green-500 to-green-700 text-white p-5 text-center">
                    <h2 className="text-xl font-bold">Growth Plan</h2>

                    {/* Popular Ribbon */}
                    <span className="absolute top-2 left-2 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded">
                      POPULAR
                    </span>
                  </div>

                  {/* Coin Plant Image */}
                  <div className="flex justify-center -mt-10">
                    <img
                      src={creator.avatar}
                      className="w-28 drop-shadow-xl"
                      alt="Growth Plan"
                    />
                  </div>

                  {/* ROI Box */}
                  <div className="bg-gray-50 dark:bg-[#10192e] mx-4 mt-3 p-4 rounded-xl border border-gray-200 dark:border-[#172036]">
                    <div className="flex justify-between py-2 border-b border-gray-200 dark:border-[#172036]">
                      <span className="font-semibold text-sm">Amount</span>
                      <span className="font-bold text-green-700">$100</span>
                    </div>

                    <div className="flex justify-between py-2 border-b border-gray-200 dark:border-[#172036]">
                      <span className="font-semibold text-sm">Daily ROI</span>
                      <span className="font-bold text-green-700">0.3%</span>
                    </div>

                    <div className="flex justify-between py-2">
                      <span className="font-semibold text-sm">Duration</span>
                      <span className="font-bold text-green-700">365 Days</span>
                    </div>
                  </div>

                  {/* Button */}
                  <div className="p-4">
                    <button className="w-full bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white py-3 rounded-full font-bold transition">
                      INVEST NOW →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Template;

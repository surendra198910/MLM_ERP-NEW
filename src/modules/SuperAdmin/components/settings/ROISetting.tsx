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
            ROI Setting
          </h5>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 sm:w-auto w-full">
          <div className="flex flex-col sm:flex-row items-center gap-3 flex-wrap justify-end">
            

            

            {/* 3. BUTTONS GROUP (Exactly from your design) */}
            <div className="flex items-center gap-2">
             

              {/* ADD BUTTON */}
              <button
                type="button"
                className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                Sumit
              </button>

              
            </div>
          </div>
        </div>
      </div>

      {/* --- CONTENT CONTAINER --- */}
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="trezo-card mb-[25px]">
          <div className="trezo-card-content">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-[25px]">
              {currentCreators.map((pkg) => (
                <div
                  key={pkg.id}
                  className="relative group bg-white/80 dark:bg-[#0b1220]/80 backdrop-blur-xl border border-blue-100 dark:border-blue-900/40 rounded-3xl shadow-md hover:shadow-2xl transition-all duration-300 p-6 flex flex-col min-w-[280px] max-w-[320px]"
                >
                  {/* Top Glow */}
                  <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-blue-500/60 to-transparent"></div>

                  {/* Ribbon Badge */}
                  <div className="absolute top-0 right-0 z-20">
                    <div className="relative">
                      <div className="absolute right-0 top-0 w-24 h-24 overflow-hidden">
                        <span className="absolute top-[22px] right-[-38px] w-40 rotate-45 bg-blue-600 text-white text-[11px] font-semibold tracking-wide text-center py-1 shadow-md">
                          ACTIVE
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Header */}
                  <div className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight leading-snug">
                    {pkg.name}
                  </div>

                  {/* Image */}
                  <div className="mt-6 flex justify-center">
                    <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-[#111827] dark:to-[#020617] p-[2px] shadow-lg">
                      <img
                        src={pkg.banner}
                        alt="package"
                        className="w-full h-full object-cover rounded-2xl bg-white"
                      />
                    </div>
                  </div>

                  {/* Investment Amount */}
                  <div className="mt-5 text-center">
                    <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      ${pkg.items}
                    </p>
                  </div>

                  {/* Details Card */}
                  <div className=" bg-blue-50/60 dark:bg-[#0f172a] border border-blue-100 dark:border-blue-900/40 rounded-2xl p-4 space-y-4 text-sm">
                    {/* ROI Input */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 dark:text-gray-400">
                        Daily ROI (%)
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.30"
                        className="w-24 text-right bg-white dark:bg-[#020617] border border-blue-200 dark:border-blue-800 rounded-xl px-3 py-1.5 text-sm font-semibold text-blue-700 dark:text-blue-400 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    {/* Duration */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 dark:text-gray-400">
                        Duration
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-gray-200">
                        365 Days
                      </span>
                    </div>
                  </div>

                  {/* Investment Input (replacing button) */}
                  {/* <div className="mt-6">
                    <input
                      type="number"
                      placeholder="Enter investment amount"
                      className="w-full rounded-2xl px-4 py-3 bg-white dark:bg-[#020617] border border-blue-200 dark:border-blue-800 text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none shadow-inner"
                    />
                  </div> */}
                  {/* Footer Note */}
                  <p className="mt-4 text-[11px] text-gray-400 text-center tracking-wide">
                    Smart returns start with smart investments.
                  </p>
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

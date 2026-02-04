import React from "react";

type TablePaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  onItemsPerPageChange: (value: number) => void;
  totalCount: number;
  displayedCount: number;
};

const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  onItemsPerPageChange,
  totalCount,
  displayedCount,
}) => (
  <div className="px-[20px] md:px-[25px] pt-[12px] md:pt-[14px] sm:flex sm:items-center justify-between">
    <p className="!mb-0 !text-sm">
      Showing {displayedCount} of {totalCount} results
    </p>
    <ol className="mt-[10px] sm:mt-0 space-x-1">
      <li className="inline-block">
        <button
          type="button"
          className="w-[31px] h-[31px] block leading-[29px] relative text-center rounded-md border border-gray-100 dark:border-[#172036] transition-all hover:bg-primary-500 hover:text-white hover:border-primary-500"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <span className="opacity-0">0</span>
          <i className="material-symbols-outlined left-0 right-0 absolute top-1/2 -translate-y-1/2">
            chevron_left
          </i>
        </button>
      </li>
      {[...Array(totalPages)].map((_, index) => (
        <li className="inline-block" key={index}>
          <button
            onClick={() => onPageChange(index + 1)}
            className={`w-[31px] h-[31px] block rounded-md border ${
              currentPage === index + 1
                ? "border-primary-500 bg-primary-500 text-white"
                : "border-gray-100 dark:border-[#172036]"
            }`}
          >
            {index + 1}
          </button>
        </li>
      ))}
      <li className="inline-block">
        <button
          type="button"
          className="w-[31px] h-[31px] block leading-[29px] relative text-center rounded-md border border-gray-100 dark:border-[#172036] transition-all hover:bg-primary-500 hover:text-white hover:border-primary-500"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <span className="opacity-0">0</span>
          <i className="material-symbols-outlined left-0 right-0 absolute top-1/2 -translate-y-1/2">
            chevron_right
          </i>
        </button>
      </li>
    </ol>
    <div className="relative group">
      <select
        value={itemsPerPage}
        onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
        className="h-8 w-[120px] px-3 pr-7 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-transparent border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-all appearance-none"
      >
        <option value="10">10 / page</option>
        <option value="25">25 / page</option>
        <option value="50">50 / page</option>
        <option value="100">100 / page</option>
      </select>
      <span className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
        <i className="material-symbols-outlined text-[18px] text-gray-500">
          expand_more
        </i>
      </span>
    </div>
  </div>
);

export default TablePagination;

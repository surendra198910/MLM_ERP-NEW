import React from "react";

const CustomPagination = ({
  currentPage,
  rowsPerPage,
  rowCount,
  onChangePage,
  onChangeRowsPerPage,
}) => {
  const totalPages = Math.ceil(rowCount / rowsPerPage);
  const start = (currentPage - 1) * rowsPerPage + 1;
  const end = Math.min(currentPage * rowsPerPage, rowCount);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-2 border-t bg-white dark:bg-[#0c1427]">

      {/* LEFT INFO TEXT */}
      <div className="text-xs text-gray-600 dark:text-gray-300">
        Showing <b>{start}</b> - <b>{end}</b> of <b>{rowCount}</b> results
      </div>

      {/* RIGHT PAGINATION CONTROLS */}
      <div className="flex items-center gap-2">

        {/* Page Size Dropdown */}
        <select
          value={rowsPerPage}
          onChange={(e) => onChangeRowsPerPage(Number(e.target.value), currentPage)}
          className="border rounded px-2 py-1 text-xs dark:bg-[#15203c] dark:text-white"
        >
          {[10, 25, 50, 100].map((size) => (
            <option key={size} value={size}>
              {size} / page
            </option>
          ))}
        </select>

        {/* Prev Button */}
        <button
          onClick={() => onChangePage(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-2 py-1 border rounded text-xs disabled:opacity-40"
        >
          &lt;
        </button>

        {/* Page Numbers */}
        {[...Array(totalPages)].map((_, i) => {
          const page = i + 1;
          return (
            <button
              key={page}
              onClick={() => onChangePage(page)}
              className={`px-2 py-1 border rounded text-xs ${
                currentPage === page
                  ? "bg-primary-button-bg text-white"
                  : "bg-white dark:bg-[#15203c]"
              }`}
            >
              {page}
            </button>
          );
        })}

        {/* Next Button */}
        <button
          onClick={() => onChangePage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-2 py-1 border rounded text-xs disabled:opacity-40"
        >
          &gt;
        </button>
      </div>
    </div>
  );
};

export default CustomPagination;
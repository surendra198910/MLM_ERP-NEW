"use client";

import React, { useEffect, useState } from "react";

type CustomPaginationProps = {
  currentPage: number;
  rowsPerPage: number;
  rowCount: number;
  onChangePage: (page: number) => void;
  onChangeRowsPerPage: (size: number, page: number) => void;
};

const CustomPagination: React.FC<CustomPaginationProps> = ({
  currentPage,
  rowsPerPage,
  rowCount,
  onChangePage,
  onChangeRowsPerPage,
}) => {
  const [maxVisiblePages, setMaxVisiblePages] = useState(7);

  /* ==============================
     Responsive visible pages
  ============================== */
  useEffect(() => {
    const update = () => {
      if (window.innerWidth < 640) setMaxVisiblePages(3);
      else if (window.innerWidth < 1024) setMaxVisiblePages(5);
      else setMaxVisiblePages(7);
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  /* ==============================
     Calculations
  ============================== */
  const totalPages = Math.ceil(rowCount / rowsPerPage);
  const safeTotalPages = Math.max(1, totalPages);

  const startRow = rowCount === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const endRow =
    rowCount === 0 ? 0 : Math.min(currentPage * rowsPerPage, rowCount);

  const getVisiblePages = () => {
    const half = Math.floor(maxVisiblePages / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(safeTotalPages, start + maxVisiblePages - 1);

    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    return { start, end };
  };

  const { start, end } = getVisiblePages();

  if (rowCount === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 border-t bg-white dark:bg-[#0c1427]">
      
      {/* LEFT INFO */}
      <div className="text-xs text-gray-600 dark:text-gray-300">
        Showing <b>{startRow}</b> – <b>{endRow}</b> of <b>{rowCount}</b> results
      </div>

      {/* RIGHT CONTROLS */}
      <div className="flex flex-wrap items-center gap-2">

       

        {/* Pagination */}
        <ol className="flex flex-wrap gap-1">
          {/* Prev */}
          <li>
            <button
              disabled={currentPage === 1}
              onClick={() => onChangePage(currentPage - 1)}
              className="w-[31px] h-[31px] border rounded disabled:opacity-40"
            >
              ‹
            </button>
          </li>

          {/* First */}
          {start > 1 && (
            <>
              <li>
                <button
                  onClick={() => onChangePage(1)}
                  className="w-[31px] h-[31px] border rounded"
                >
                  1
                </button>
              </li>
              {start > 2 && <li className="px-1 text-gray-400">…</li>}
            </>
          )}

          {/* Numbers */}
          {Array.from({ length: end - start + 1 }, (_, i) => {
            const page = start + i;
            return (
              <li key={page}>
                <button
                  onClick={() => onChangePage(page)}
                  className={`w-[31px] h-[31px] border rounded transition-all ${
                    page === currentPage
                      ? "bg-primary-button-bg text-white border-primary-button-bg"
                      : "dark:border-[#172036]"
                  }`}
                >
                  {page}
                </button>
              </li>
            );
          })}

          {/* Last */}
          {end < safeTotalPages && (
            <>
              {end < safeTotalPages - 1 && (
                <li className="px-1 text-gray-400">…</li>
              )}
              <li>
                <button
                  onClick={() => onChangePage(safeTotalPages)}
                  className="w-[31px] h-[31px] border rounded"
                >
                  {safeTotalPages}
                </button>
              </li>
            </>
          )}

          {/* Next */}
          <li>
            <button
              disabled={currentPage === safeTotalPages}
              onClick={() => onChangePage(currentPage + 1)}
              className="w-[31px] h-[31px] border rounded disabled:opacity-40"
            >
              ›
            </button>
          </li>
        </ol>
      </div>
    </div>
  );
};

export default CustomPagination;
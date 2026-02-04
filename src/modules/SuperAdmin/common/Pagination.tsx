"use client";

import React, { useEffect, useState } from "react";

type PaginationProps = {
  currentPage: number;
  totalPages: number;     // can be 0 or 1 from backend
  totalCount: number;     // total records
  pageSize: number;
  onPageChange: (page: number) => void;
};

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
}) => {
  const [maxVisiblePages, setMaxVisiblePages] = useState(7);

  /* ================================
     Responsive visible pages
  ================================= */
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

  /* ================================
     Normalize total pages
     Always show at least page 1
  ================================= */
  const safeTotalPages = Math.max(1, totalPages);

  /* ================================
     Calculate visible page range
  ================================= */
  const getVisiblePages = () => {
    const half = Math.floor(maxVisiblePages / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(safeTotalPages, start + maxVisiblePages - 1);

    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    return { start, end };
  };

  /* ================================
     Showing text safety
  ================================= */
  const showingFrom =
    totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;

  const showingTo =
    totalCount === 0 ? 0 : Math.min(currentPage * pageSize, totalCount);

  const { start, end } = getVisiblePages();

  /* ================================
     Hide pagination ONLY if no data
  ================================= */
  if (totalCount === 0) return null;

  return (
    <div
      className="
        px-[20px] md:px-[25px] pt-[12px] md:pt-[14px]
        flex flex-col sm:flex-row sm:items-center
        gap-3 justify-between
      "
    >
      {/* Result info */}
      <p className="!mb-0 !text-sm text-center sm:text-left">
        Showing {showingFrom} – {showingTo} of {totalCount} results
      </p>

      {/* Pagination */}
      <ol className="flex flex-wrap justify-center sm:justify-end gap-1">
        {/* Prev */}
        <li>
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="
              w-[31px] h-[31px] rounded-md border
              disabled:opacity-50 disabled:cursor-not-allowed
              hover:bg-primary-button-bg hover:text-white
              transition-all
            "
          >
            ‹
          </button>
        </li>

        {/* First + Ellipsis */}
        {start > 1 && (
          <>
            <li>
              <button
                type="button"
                onClick={() => onPageChange(1)}
                className="w-[31px] h-[31px] rounded-md border"
              >
                1
              </button>
            </li>
            {start > 2 && <li className="px-1 text-gray-400">…</li>}
          </>
        )}

        {/* Page Numbers */}
        {Array.from({ length: end - start + 1 }, (_, i) => {
          const page = start + i;
          return (
            <li key={page}>
              <button
                type="button"
                onClick={() => onPageChange(page)}
                className={`
                  w-[31px] h-[31px] rounded-md border transition-all
                  ${
                    page === currentPage
                      ? "bg-primary-button-bg text-white border-primary-button-bg"
                      : "border-gray-100 dark:border-[#172036]"
                  }
                `}
              >
                {page}
              </button>
            </li>
          );
        })}

        {/* Last + Ellipsis */}
        {end < safeTotalPages && (
          <>
            {end < safeTotalPages - 1 && (
              <li className="px-1 text-gray-400">…</li>
            )}
            <li>
              <button
                type="button"
                onClick={() => onPageChange(safeTotalPages)}
                className="w-[31px] h-[31px] rounded-md border"
              >
                {safeTotalPages}
              </button>
            </li>
          </>
        )}

        {/* Next */}
        <li>
          <button
            type="button"
            disabled={currentPage === safeTotalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="
              w-[31px] h-[31px] rounded-md border
              disabled:opacity-50 disabled:cursor-not-allowed
              hover:bg-primary-button-bg hover:text-white
              transition-all
            "
          >
            ›
          </button>
        </li>
      </ol>
    </div>
  );
};

export default Pagination;

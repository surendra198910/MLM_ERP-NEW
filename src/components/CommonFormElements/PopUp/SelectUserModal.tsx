"use client";

import React, { useEffect, useState } from "react";
import { FaUserCircle } from "react-icons/fa";

/* =========================================================
   TYPES
========================================================= */
type PaginationProps = {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
};

type SelectUserModalProps = {
  open: boolean;
  onClose: () => void;
  users: any[];
  onSelect: (user: any) => void;
  search: string;
  setSearch: (text: string) => void;
};

/* =========================================================
   HELPERS (EXACT SAME LOGIC)
========================================================= */
const getImageUrl = (img?: string) => {
  if (!img) return "";
  const clean = img.split("|")[0];
  if (clean.startsWith("http")) return clean;
  return `${import.meta.env.VITE_IMAGE_PREVIEW_URL}${clean}`;
};

/* =========================================================
   PAGINATION (UNCHANGED)
========================================================= */
export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
}) => {
  const [maxVisiblePages, setMaxVisiblePages] = useState(7);

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

  const safeTotalPages = Math.max(1, totalPages);

  const getVisiblePages = () => {
    const half = Math.floor(maxVisiblePages / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(safeTotalPages, start + maxVisiblePages - 1);

    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    return { start, end };
  };

  const showingFrom =
    totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const showingTo =
    totalCount === 0 ? 0 : Math.min(currentPage * pageSize, totalCount);

  const { start, end } = getVisiblePages();

  if (totalCount === 0) return null;

  return (
    <div className="px-[20px] md:px-[25px] pt-[12px] md:pt-[14px] flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
      <p className="!mb-0 !text-sm text-center sm:text-left">
        Showing {showingFrom} – {showingTo} of {totalCount} results
      </p>

      <ol className="flex flex-wrap justify-center sm:justify-end gap-1">
        <li>
          <button
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="w-[31px] h-[31px] rounded-md border disabled:opacity-50 hover:bg-primary-button-bg hover:text-white transition-all"
          >
            ‹
          </button>
        </li>

        {start > 1 && (
          <>
            <li>
              <button
                onClick={() => onPageChange(1)}
                className="w-[31px] h-[31px] rounded-md border"
              >
                1
              </button>
            </li>
            {start > 2 && <li className="px-1 text-gray-400">…</li>}
          </>
        )}

        {Array.from({ length: end - start + 1 }, (_, i) => {
          const page = start + i;
          return (
            <li key={page}>
              <button
                onClick={() => onPageChange(page)}
                className={`w-[31px] h-[31px] rounded-md border transition-all ${
                  page === currentPage
                    ? "bg-primary-button-bg text-white border-primary-button-bg"
                    : "border-gray-100 dark:border-[#172036]"
                }`}
              >
                {page}
              </button>
            </li>
          );
        })}

        {end < safeTotalPages && (
          <>
            {end < safeTotalPages - 1 && (
              <li className="px-1 text-gray-400">…</li>
            )}
            <li>
              <button
                onClick={() => onPageChange(safeTotalPages)}
                className="w-[31px] h-[31px] rounded-md border"
              >
                {safeTotalPages}
              </button>
            </li>
          </>
        )}

        <li>
          <button
            disabled={currentPage === safeTotalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="w-[31px] h-[31px] rounded-md border disabled:opacity-50 hover:bg-primary-button-bg hover:text-white transition-all"
          >
            ›
          </button>
        </li>
      </ol>
    </div>
  );
};

/* =========================================================
   SELECT USER MODAL (PIXEL PERFECT)
========================================================= */
const SelectUserModal: React.FC<SelectUserModalProps> = ({
  open,
  onClose,
  users,
  onSelect,
  search,
  setSearch,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState(search);
  const pageSize = 8;

useEffect(() => {
  if (open) {
    setSearchInput(search || "");
    setCurrentPage(1);
  }
}, [open, search]); // ✅ add `search`


  if (!open) return null;

  const totalCount = users.length;
  const totalPages = Math.ceil(totalCount / pageSize);

  const pagedUsers = users.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="fixed inset-0 z-[999] bg-black/40 flex items-center justify-center">
      <div className="bg-white dark:bg-[#0c1427] w-[420px] min-h-[520px] flex flex-col rounded-xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <p className="text-lg font-semibold text-gray-800 dark:text-white">
              Select User
            </p>
            <p className="text-xs text-gray-500 -mt-4">
              Click on a user to assign
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 dark:hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search name, role, company..."
                value={searchInput}
onChange={(e) => {
  setSearchInput(e.target.value);
  setCurrentPage(1); // ✅ IMPORTANT
}}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    setSearch(searchInput);
                    setCurrentPage(1);
                  }
                }}
                className="w-full border rounded-md pl-9 pr-9 py-2 text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400"
              />

              {searchInput && (
                <button
                  onClick={() => {
                    setSearchInput("");
                    setSearch("");
                    setCurrentPage(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              onClick={() => {
                setSearch(searchInput);
                setCurrentPage(1);
              }}
              className="px-3 py-2 rounded-md bg-primary-500 hover:bg-primary-600 text-white text-sm"
            >
              Search
            </button>
          </div>
        </div>

        {/* User List */}
        <div className="h-[320px] overflow-y-auto">
          {pagedUsers.map((u) => (
            <div
              key={u.EmployeeId}
              onClick={() => onSelect(u)}
              className="flex items-center gap-x-5 px-5 py-3 border-b cursor-pointer hover:bg-gray-50 dark:hover:bg-[#16203a]"
            >
              <div className="w-15 h-15 rounded-md overflow-hidden bg-gray-200 dark:bg-gray-700">
                {u.ProfilePic ? (
                  <img
                    src={getImageUrl(u.ProfilePic)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-gray-500">
                    {u.Name?.charAt(0)}
                  </div>
                )}
              </div>

              <div className="h-15 flex flex-col justify-between min-w-0">
                <span className="text-[13px] font-medium truncate">
                  {u.Name}
                </span>
                <span className="text-[12px] text-gray-500 truncate">
                  {u.DesignationName}
                </span>
                <span className="text-[11px] text-gray-400 truncate">
                  {u.CompanyName}
                </span>
              </div>
            </div>
          ))}

          {pagedUsers.length === 0 && (
            <div className="p-6 text-center text-sm text-gray-400">
              No users found
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2 mb-2">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
};

export default SelectUserModal;

import React, { useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";
import { FiSearch } from "react-icons/fi";

/* =========================================================
   TYPES
========================================================= */
interface Client {
  ClientId: number | string;
  ClientName: string;
  Email?: string;
  ContactNo?: string;
  ClientLogo?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  clients: Client[];
  search: string;
  setSearch: (val: string) => void;
  onSelect: (client: Client) => void;
}

/* =========================================================
   COMPONENT
========================================================= */
const SelectClientModal: React.FC<Props> = ({
  open,
  onClose,
  clients,
  search,
  setSearch,
  onSelect,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState(search);
  const pageSize = 8;

  useEffect(() => {
    if (open) {
      setSearchInput(search || "");
      setCurrentPage(1);
    }
  }, [open, search]);

  if (!open) return null;

  /* Pagination */
  const totalCount = clients.length;
  const totalPages = Math.ceil(totalCount / pageSize);

  const pagedClients = clients.slice(
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
              Select Client
            </p>
            <p className="text-xs text-gray-500 -mt-4">
              Search and select a client
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500"
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            
            {/* Input */}
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

              <input
                type="text"
                placeholder="Search client..."
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setCurrentPage(1);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setSearch(searchInput);
                  }
                }}
                className="w-full border rounded-md pl-9 pr-9 py-2 text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100"
              />

              {/* Clear */}
              {searchInput && (
                <button
                  onClick={() => {
                    setSearchInput("");
                    setSearch("");
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Search Button */}
            <button
              onClick={() => setSearch(searchInput)}
              className="px-3 py-2 rounded-md bg-primary-500 hover:bg-primary-600 text-white text-sm"
            >
              Search
            </button>
          </div>
        </div>

        {/* Client List */}
        <div className="h-[320px] overflow-y-auto">
          {pagedClients.map((c) => (
            <div
              key={c.ClientId}
              onClick={() => onSelect(c)}
              className="flex items-center gap-x-4 px-5 py-3 border-b cursor-pointer hover:bg-gray-50 dark:hover:bg-[#16203a]"
            >
              {/* Avatar */}
              <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                {c.ClientLogo ? (
                  <img
                    src={`${import.meta.env.VITE_IMAGE_PREVIEW_URL}${c.ClientLogo}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-semibold text-gray-500">
                    {c.ClientName?.charAt(0)}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] font-medium truncate text-gray-800 dark:text-white">
                  {c.ClientName}
                </span>

                <span className="text-[12px] text-gray-500 truncate">
                  {c.Email || c.ContactNo}
                </span>

                <span className="text-[11px] text-gray-400 truncate">
                  {c.ContactNo}
                </span>
              </div>
            </div>
          ))}

          {pagedClients.length === 0 && (
            <div className="p-6 text-center text-sm text-gray-400">
              No clients found
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2">
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>
              Showing {(currentPage - 1) * pageSize + 1} -{" "}
              {Math.min(currentPage * pageSize, totalCount)} of {totalCount}
            </span>

            <div className="flex gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-2 py-1 border rounded disabled:opacity-50"
              >
                ‹
              </button>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-2 py-1 border rounded disabled:opacity-50"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectClientModal;
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiService } from "../../../../services/ApiService";

/* ====================================================
   TYPES
==================================================== */
type SearchItem = {
  ModuleID: number;
  ModuleTitle: string;
  ModuleRoute: string;
  FormId: number;
  FormDisplayName: string;
  FormCategoryName: string;
  ParentCategoryName?: string | null;
};

const SearchPopup: React.FC = () => {
  const navigate = useNavigate();
  const { universalService } = ApiService();

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [loadingClick, setLoadingClick] = useState(false);
  const [noData, setNoData] = useState(false);

  /* ====================================================
     SEARCH API
==================================================== */
  const fetchSearchResults = async (searchText: string) => {
    if (!searchText.trim()) {
      setResults([]);
      setNoData(false);
      return;
    }

    const saved = localStorage.getItem("EmployeeDetails");
    const employeeId = saved ? JSON.parse(saved).EmployeeId : 0;
    if (!employeeId) return;

    const response = await universalService({
      procName: "MenuItems",
      Para: JSON.stringify({
        ActionMode: "global-search",
        EmployeeId: employeeId,
      }),
    });

    if (response === "NoRecord" || response?.data === "NoRecord") {
      setResults([]);
      setNoData(true);
      return;
    }

    const rows: SearchItem[] = Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response)
      ? response
      : [];

    const filtered = rows.filter(
      (x) =>
        x.FormDisplayName?.toLowerCase().includes(searchText.toLowerCase()) ||
        x.FormCategoryName?.toLowerCase().includes(searchText.toLowerCase()) ||
        x.ModuleTitle?.toLowerCase().includes(searchText.toLowerCase())
    );

    setResults(filtered.slice(0, 12));
    setNoData(filtered.length === 0);
  };

  /* ====================================================
     DEBOUNCE SEARCH
==================================================== */
  useEffect(() => {
    if (!open) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      fetchSearchResults(query);
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, open]);

  /* ====================================================
     SEARCH ICON CLICK
==================================================== */
  const handleSearchIconClick = () => {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  /* ====================================================
     ENTER KEY SEARCH
==================================================== */
  const handleEnterSearch = async () => {
    try {
      setLoadingClick(true);
      await fetchSearchResults(query);
    } finally {
      setLoadingClick(false);
    }
  };

  /* ====================================================
     NAVIGATION
==================================================== */
  const handleSelect = (item: SearchItem) => {
    const route = `${item.ModuleRoute}/${slugify(
      item.FormCategoryName
    )}/${slugify(item.FormDisplayName)}`;

    navigate(route);
    resetPopup();
  };

  const resetPopup = () => {
    setOpen(false);
    setQuery("");
    setResults([]);
    setNoData(false);
  };

  /* ====================================================
     HELPERS
==================================================== */
  const slugify = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  /* ====================================================
     OUTSIDE CLICK
==================================================== */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        resetPopup();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ====================================================
     UI
==================================================== */
  return (
    <div ref={wrapperRef} className="relative">
      {/* SEARCH ICON */}
      <div className="relative group inline-block ml-3">
        <button
          onClick={handleSearchIconClick}
          className="p-2 hover:text-primary-500
               dark:hover:bg-[#172036]
               rounded-md transition-all"
        >
          <i className="material-symbols-outlined !text-[25px]">search</i>
        </button>

        {/* TOOLTIP */}
        <div
          className="absolute left-1/2 -translate-x-1/2 -bottom-[32px]
               px-2 py-1 text-xs rounded
               bg-gray-800 text-white
               opacity-0 group-hover:opacity-100
               transition-opacity
               whitespace-nowrap
               pointer-events-none"
        >
          Search
          {/* ARROW */}
          <div
            className="absolute -top-1 left-1/2 -translate-x-1/2
                 w-0 h-0
                 border-l-4 border-r-4 border-b-4
                 border-l-transparent
                 border-r-transparent
                 border-b-gray-800"
          />
        </div>
      </div>

      {/* POPUP */}
      {open && (
        <div
          className="absolute left-1/2 -translate-x-1/2 mt-3 w-[360px]
                     bg-white dark:bg-[#0c1427]
                     border border-gray-200 dark:border-[#172036]
                     rounded-lg shadow-3xl z-50"
        >
          {/* INPUT */}
          <div className="relative p-3 border-b border-gray-200 dark:border-[#172036]">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleEnterSearch()}
              placeholder="Search here..."
              className="w-full h-[44px] rounded-md px-4 pr-10
                         bg-gray-50 border border-gray-200
                         dark:bg-[#15203c] dark:text-white dark:border-[#15203c]
                         outline-none"
            />

            <button
              onClick={handleEnterSearch}
              className="absolute right-5 top-1/2 -translate-y-1/2
                         text-primary-500"
            >
              <i className="material-symbols-outlined !text-[20px]">
                {loadingClick ? "hourglass_top" : "search"}
              </i>
            </button>
          </div>

          {/* RESULTS */}
          <ul className="max-h-72 overflow-auto">
            {noData && (
              <li className="px-4 py-4 text-sm text-gray-500 text-center">
                No data found
              </li>
            )}

            {!noData &&
              results.map((item) => (
                <li
                  key={item.FormId}
                  onClick={() => handleSelect(item)}
                  className="px-4 py-3 cursor-pointer text-sm
                             hover:bg-gray-100 dark:hover:bg-[#172036]"
                >
                  <div className="font-medium">{item.FormDisplayName}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {item.ModuleTitle}
                    {item.ParentCategoryName
                      ? ` → ${item.ParentCategoryName}`
                      : ""}
                    {" → "}
                    {item.FormCategoryName}
                  </div>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchPopup;

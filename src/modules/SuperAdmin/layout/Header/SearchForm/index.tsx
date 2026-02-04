import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiService } from "../../../../../services/ApiService";

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

const SearchForm: React.FC = () => {
  const navigate = useNavigate();
  const { universalService } = ApiService();

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loadingClick, setLoadingClick] = useState(false);
  const [noData, setNoData] = useState(false); // ✅ NEW

  /* ====================================================
     SEARCH API
==================================================== */
  const fetchSearchResults = async (searchText: string) => {
    if (!searchText.trim()) {
      setResults([]);
      setOpen(false);
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

    // 🔥 HANDLE "NoRecord"
    if (
      response === "NoRecord" ||
      response?.data === "NoRecord"
    ) {
      setResults([]);
      setNoData(true);
      setOpen(true);
      return;
    }

    const rows: SearchItem[] =
      Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
        ? response
        : [];

    if (!rows.length) {
      setResults([]);
      setNoData(true);
      setOpen(true);
      return;
    }

    const filtered = rows.filter(
      (x) =>
        x.FormDisplayName?.toLowerCase().includes(searchText.toLowerCase()) ||
        x.FormCategoryName?.toLowerCase().includes(searchText.toLowerCase()) ||
        x.ModuleTitle?.toLowerCase().includes(searchText.toLowerCase())
    );

    setResults(filtered.slice(0, 12));
    setNoData(filtered.length === 0);
    setOpen(true);
  };

  /* ====================================================
     DEBOUNCE ON TYPE (NO LOADER)
==================================================== */
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      fetchSearchResults(query);
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  /* ====================================================
     SEARCH ICON CLICK (WITH LOADER)
==================================================== */
  const handleSearchClick = async () => {
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
    setQuery("");
    setResults([]);
    setOpen(false);
    setNoData(false);
  };

  /* ====================================================
     HELPERS
==================================================== */
  const slugify = (text: string) =>
    text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  /* ====================================================
     OUTSIDE CLICK
==================================================== */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ====================================================
     UI
==================================================== */
  return (
    <div ref={wrapperRef} className="relative w-[250px] lg:w-[260px]">
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSearchClick()}
        placeholder="Search here..."
        className="bg-gray-50 border border-gray-50 h-[44px] rounded-md w-full
                   px-[13px] md:px-[16px] outline-0
                   dark:bg-[#15203c] dark:text-white dark:border-[#15203c]"
      />

      <button
        type="button"
        onClick={handleSearchClick}
        className="absolute text-primary-500 top-1/2 -translate-y-1/2
                   right-[13px] md:right-[15px]"
      >
        <i className="material-symbols-outlined !text-[20px]">
          {loadingClick ? "hourglass_top" : "search"}
        </i>
      </button>

      {open && (
        <ul className="absolute z-50 mt-1 w-full bg-white dark:bg-[#0c1427]
                       border border-gray-200 dark:border-[#172036]
                       rounded-md shadow-lg max-h-72 overflow-auto">

          {/* ✅ NO DATA FOUND */}
          {noData && (
            <li className="px-4 py-3 text-sm text-gray-500 text-center">
              No data found
            </li>
          )}

          {!noData &&
            results.map((item) => (
              <li
                key={item.FormId}
                onClick={() => handleSelect(item)}
                className="px-4 py-2 cursor-pointer text-sm
                           hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <div className="font-medium">{item.FormDisplayName}</div>
                <div className="text-xs text-gray-500">
                  {item.ModuleTitle}
                  {item.ParentCategoryName ? ` → ${item.ParentCategoryName}` : ""}
                  {" → "}
                  {item.FormCategoryName}
                </div>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
};

export default SearchForm;

import React, { useState, useEffect, useRef } from "react";

interface Member {
  id: number;
  username: string;
  name: string;
}

interface Props {
  memberList: Member[];
  loading: boolean;
  onSearch: (text: string) => void;
  onSelect: (member: Member) => void;

  value?: string; // optional controlled value
  clearTrigger?: number; // change value to reset
}

const MemberAutocomplete: React.FC<Props> = ({
  memberList,
  loading,
  onSearch,
  onSelect,
  value,
  clearTrigger,
}) => {
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const isUserTyping = useRef(false); // ✅ key fix

  /* ---------- SYNC VALUE FROM PARENT (NO API CALL) ---------- */
  useEffect(() => {
    if (value !== undefined) {
      isUserTyping.current = false;
      setQuery(value);
    }
  }, [value]);

  /* ---------- CLEAR FROM PARENT (NO API CALL) ---------- */
  useEffect(() => {
    if (clearTrigger !== undefined) {
      isUserTyping.current = false;
      setQuery("");
      setShowDropdown(false);
    }
  }, [clearTrigger]);

  /* ---------- SEARCH ONLY WHEN USER TYPES ---------- */
  useEffect(() => {
    if (!isUserTyping.current) return;

    if (query.length < 3) {
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(() => {
      onSearch(query);
      setShowDropdown(true);
      isUserTyping.current = false;
    }, 400);

    return () => clearTimeout(timer);
  }, [query, onSearch]);

  /* ---------- SELECT MEMBER ---------- */
  const handleSelect = (member: Member) => {
    isUserTyping.current = false;
    setQuery(member.username);
    setShowDropdown(false);
    onSelect(member);
  };

  /* ---------- CLOSE ON OUTSIDE CLICK ---------- */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative w-full">
      {/* Input */}
      <input
        type="text"
        value={query}
        placeholder="Type at least 3 characters..."
        onChange={(e) => {
          isUserTyping.current = true;
          setQuery(e.target.value);
        }}
        className="
          w-full h-10 px-3 text-sm
          border border-gray-200 rounded-md
          bg-white dark:bg-gray-800
          dark:border-gray-700 dark:text-gray-100
          placeholder-gray-400 dark:placeholder-gray-500
          focus:outline-none focus:border-primary-500
          focus:ring-1 focus:ring-primary-500
          transition-all
        "
      />

      {/* Dropdown */}
      {showDropdown && (
        <div
          className="
            absolute top-[44px] left-0 w-full
            bg-white dark:bg-[#0c1427]
            border border-gray-200 dark:border-gray-700
            rounded-xl shadow-lg
            z-[9999] overflow-hidden
          "
        >
          {loading && (
            <p className="px-4 py-2 text-sm text-gray-500">Loading...</p>
          )}

          {!loading && memberList.length === 0 && (
            <p className="px-4 py-2 text-sm text-gray-400">
              No members found...
            </p>
          )}

          {!loading && memberList.length > 0 && (
            <ul
              className="
    max-h-48
    overflow-y-auto
    divide-y divide-gray-100 dark:divide-gray-700
    scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600
  "
            >
              {memberList.map((member) => (
                <li
                  key={member.id}
                  onClick={() => handleSelect(member)}
                  className="
        group
        px-4 py-2.5
        cursor-pointer
        flex items-center justify-between
        rounded-md
        hover:bg-blue-50 dark:hover:bg-[#172036]
        focus:bg-blue-50
        transition-all duration-150
        text-sm
      "
                >
                  {/* LEFT: Username */}
                  <div className="flex flex-col min-w-0">
                    <span
                      className="
            font-semibold text-gray-800 dark:text-white
            group-hover:text-blue-600
          "
                    >
                      {member.username}
                    </span>

                    {/* Secondary info (mobile-friendly) */}
                    <span className="text-xs text-gray-400 truncate sm:hidden">
                      {member.name}
                    </span>
                  </div>

                  {/* RIGHT: Name */}
                  <span
                    className="
          text-xs text-gray-500 dark:text-gray-400
          truncate max-w-[160px]
          hidden sm:block
        "
                  >
                    {member.name}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default MemberAutocomplete;

import React, { useState, useEffect, useRef } from "react";

interface Member {
  id: number;
  username: string;
  name: string;
}

interface Props {
  memberList: Member[]; // ✅ List from Parent
  loading: boolean; // ✅ Loading from Parent
  onSearch: (text: string) => void; // ✅ API trigger from Parent
  onSelect: (member: Member) => void;
}

const MemberAutocomplete: React.FC<Props> = ({
  memberList,
  loading,
  onSearch,
  onSelect,
}) => {
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);

  /* ---------------- CALL PARENT API WHEN 3 CHARS ---------------- */
  useEffect(() => {
    if (query.length < 3) {
      setShowDropdown(false);
      return;
    }

    // ✅ Debounce (400ms)
    const timer = setTimeout(() => {
      onSearch(query);
      setShowDropdown(true);
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  /* ---------------- SELECT MEMBER ---------------- */
  const handleSelect = (member: Member) => {
    setQuery(member.username);
    setShowDropdown(false);
    onSelect(member);
  };

  /* ---------------- CLOSE ON OUTSIDE CLICK ---------------- */
  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
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
        onChange={(e) => setQuery(e.target.value)}
        className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm h-10 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
      />

      {/* Dropdown */}
      {showDropdown && (
        <div
          className="
            absolute top-[48px] left-0 w-full
            bg-white border rounded-xl shadow-lg
            z-[9999] overflow-hidden
          "
        >
          {/* Loading */}
          {loading && (
            <p className="px-4 py-2 text-sm text-gray-500">Loading...</p>
          )}

          {/* No Data */}
          {!loading && memberList.length === 0 && (
            <p className="px-4 py-2 text-sm text-gray-400">
              No members found...
            </p>
          )}

          {/* Results */}
          {!loading && memberList.length > 0 && (
            <ul className="max-h-[160px] overflow-y-auto divide-y divide-gray-100">
              {memberList.map((member) => (
                <li
                  key={member.id}
                  onClick={() => handleSelect(member)}
                  className="
          px-3 py-2 cursor-pointer
          flex items-center justify-between
          hover:bg-blue-50 dark:hover:bg-[#172036]
          transition text-sm
        "
                >
                  <span className="font-semibold text-gray-800 dark:text-white">
                    {member.username}
                  </span>

                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[140px]">
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

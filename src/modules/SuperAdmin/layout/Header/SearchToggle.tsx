import React, { useRef, useState, useEffect } from "react";

const SearchToggle: React.FC = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={ref} className="relative mx-[8px]">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="text-black dark:text-white hover:text-primary-500 transition-all"
        >
          <i className="material-symbols-outlined text-[22px]">search</i>
        </button>
      ) : (
        <div className="flex items-center bg-gray-100 dark:bg-[#172036] rounded-md px-[10px] py-[6px] shadow-sm animate-fadeIn">
          <i className="material-symbols-outlined text-[20px] mr-[6px]">
            search
          </i>
          <input
            autoFocus
            type="text"
            placeholder="Search Menu..."
            className="bg-transparent outline-none text-sm w-[180px] md:w-[220px] text-black dark:text-white placeholder:text-gray-400"
          />
        </div>
      )}
    </div>
  );
};

export default SearchToggle;

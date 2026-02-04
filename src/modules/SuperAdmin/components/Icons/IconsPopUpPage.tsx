import React, { useState, useEffect } from "react";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { ApiService } from "../../../../services/ApiService";
import Loader from "../../components/Loader/LineLoader";

const IconsPopUpPage = ({ open, setOpen, onSelectIcon }) => {
  const [icons, setIcons] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");

  const { universalService } = ApiService();

  const cleanName = (name) => {
    if (!name) return "";
    return name.replace(/_/g, " ").replace(/\s+/g, " ").trim();
  };

  // FETCH ICON LIST
  const fetchIcons = async () => {
    try {
      const payload = {
        procName: "Modules",
        Para: JSON.stringify({ Action: "GetIcons" }),
      };

      const response = await universalService(payload);
      const res = response?.data || response;
      const apiRes = Array.isArray(res) ? res[0] : res;

      if (!apiRes?.IconList) {
        setIcons([]);
        return;
      }

      const parsed = JSON.parse(apiRes.IconList);

      const cleaned = parsed.map((item) => ({
        ...item,
        CleanName: cleanName(item.IconName),
      }));

      setIcons(cleaned);
      setFiltered(cleaned);
    } catch (err) {
      console.log("Error fetching icons:", err);
    }
  };

  useEffect(() => {
    if (open) {
      fetchIcons();
    }
  }, [open]);

  // SEARCH FILTER
  useEffect(() => {
    if (!search.trim()) {
      setFiltered(icons);
    } else {
      setFiltered(
        icons.filter((icon) =>
          icon.CleanName.toLowerCase().includes(search.toLowerCase())
        )
      );
    }
  }, [search, icons]);

  return (
    <Dialog open={open} onClose={() => setOpen(false)} className="relative z-999">
      <DialogBackdrop className="fixed inset-0 bg-black/40" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          className="bg-white dark:bg-[#0c1427] w-full max-w-[1200px] 
                     rounded-xl shadow-xl p-6 max-h-[95vh] overflow-hidden"
        >
          {/* HEADER */}
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="text-xl font-semibold text-black dark:text-white">
              Select Icon
            </h2>
            <button
              className="text-gray-600 dark:text-gray-300 hover:text-red-500"
              onClick={() => setOpen(false)}
            >
              <i className="ri-close-fill text-3xl"></i>
            </button>
          </div>

          {/* SEARCH INPUT */}
          <div className="mt-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search icons..."
              className="w-full px-4 py-3 border rounded-md text-black dark:text-white 
                         bg-gray-100 dark:bg-[#15203c] outline-none"
            />
          </div>

          {/* ICON GRID */}
          <div
            className="
              grid 
              grid-cols-3 
              sm:grid-cols-4 
              md:grid-cols-5 
              lg:grid-cols-6 
              xl:grid-cols-8 
              gap-4 
              mt-6 
              max-h-[55vh] 
              overflow-y-auto 
              p-2
            "
          >
            {filtered.length === 0 ? (
              <p className="text-center col-span-12 text-gray-500">
               <Loader />
              </p>
            ) : (
              filtered.map((icon) => (
                <button
                  key={icon.IconId}
                  onClick={() => {
                    onSelectIcon(icon.Icon);
                    setOpen(false);
                  }}
                  className="
                    flex flex-col items-center gap-2 p-3 border rounded-lg 
                    bg-white dark:bg-[#15203c] shadow-sm hover:shadow-lg 
                    hover:bg-primary-100 dark:hover:bg-primary-500/20 
                    transition-all overflow-hidden
                  "
                >
                  <span className="material-symbols-outlined text-4xl text-primary-600 dark:text-primary-300">
                    {icon.Icon}
                  </span>

                  <span className="text-xs text-black dark:text-white truncate text-center w-full">
                    {icon.CleanName}
                  </span>
                </button>
              ))
            )}
          </div>

          {/* FOOTNOTE */}
          {/* <p className="text-center text-xs mt-3 text-gray-500">
            (Click once to select icon)
          </p> */}
        </DialogPanel>
      </div>
    </Dialog>
  );
};

export default IconsPopUpPage;

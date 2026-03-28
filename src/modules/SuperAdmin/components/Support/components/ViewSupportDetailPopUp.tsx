"use client";

import React, { useEffect } from "react";
import { FaCommentDots } from "react-icons/fa";

interface ViewEnquiryDetailPopUpProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  content?: string | null;
}

export default function ViewEnquiryDetailPopUp({
  isOpen,
  onClose,
  title = "Full Requirement",
  content,
}: ViewEnquiryDetailPopUpProps) {
  // Close on ESC key
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999]"
      onClick={onClose}
    >
      {/* Modal */}
      <div
        className="bg-white dark:bg-[#0f172a] w-[750px] max-w-[95%] rounded-lg shadow-2xl overflow-hidden animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-[#172036] px-5 py-3">
        <div className="text-lg py-1 font-semibold text-gray-800 dark:text-white leading-tight">           
            {title}
          </div>
           <button
          onClick={onClose}
          className="text-gray-400 hover:text-red-500 transition text-md"
        >
          ✕
        </button>
        </div>

        {/* Body */}
        <div
          className="
            p-5 text-sm text-gray-700 dark:text-gray-300
            whitespace-pre-wrap break-words
            max-h-[65vh] overflow-y-auto
            leading-relaxed custom-scrollbar
          "
        >
          {content || "No details available."}
        </div>
      </div>

      {/* Animation Style */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
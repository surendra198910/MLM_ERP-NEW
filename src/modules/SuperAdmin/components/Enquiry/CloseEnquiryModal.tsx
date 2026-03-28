"use client";

import React, { useState, useEffect } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (status: string, message: string) => void;
}

export default function CloseEnquiryModal({
  isOpen,
  onClose,
  onSubmit,
}: Props) {
  const [status, setStatus] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    if (isOpen) {
      setStatus("");
      setMessage("");
      setErrors({});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: any = {};
    if (!status) newErrors.status = "The field EnqStatus is not valid";
    if (!message.trim())
      newErrors.message = "The field CloseMessage is not valid";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit(status, message);
  };

  return (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white dark:bg-[#1e293b] w-[500px] rounded-xl shadow-2xl overflow-hidden">

      {/* HEADER */}
      <div className="flex justify-between items-center border-b border-gray-200 dark:border-[#2d3a4f] px-6 py-2.5">
        <div className="text-lg py-1 font-semibold text-gray-800 dark:text-white leading-tight">
          Close Selected Enquiry
        </div>

        <button
          onClick={onClose}
          className="text-gray-400 hover:text-red-500 transition text-md"
        >
          ✕
        </button>
      </div>

      {/* BODY */}
      <div className="px-6 py-5 space-y-4">

        {/* STATUS */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Enquiry Status:<span className="text-red-500">*</span>
          </label>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={`w-full mt-1.5 border rounded-md px-3 py-2 text-sm bg-white dark:bg-[#0f172a] dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.status
                ? "border-red-500"
                : "border-gray-300 dark:border-[#334155]"
            }`}
          >
            <option value="">Select</option>
            <option value="Converted">Converted</option>
            <option value="Not Converted">Not Converted</option>
          </select>

          {errors.status && (
            <p className="text-red-500 text-xs mt-1">
              {errors.status}
            </p>
          )}
        </div>

        {/* MESSAGE */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Closure Remarks:<span className="text-red-500">*</span>
          </label>

          <textarea
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter Message"
            className={`w-full mt-1.5 border rounded-md px-3 py-2 text-sm bg-white dark:bg-[#0f172a] dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.message
                ? "border-red-500"
                : "border-gray-300 dark:border-[#334155]"
            }`}
          />

          {errors.message && (
            <p className="text-red-500 text-xs mt-1">
              {errors.message}
            </p>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <div className="flex justify-end gap-3 border-t border-gray-200 dark:border-[#2d3a4f] px-6 py-3 bg-gray-50 dark:bg-[#162033]">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 dark:bg-[#334155] dark:text-white rounded-md text-sm hover:bg-gray-300 dark:hover:bg-[#475569] transition"
        >
          Cancel
        </button>

        <button
          onClick={handleSubmit}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm transition shadow-sm"
        >
          Close Enquiry
        </button>
      </div>
    </div>
  </div>
);
}

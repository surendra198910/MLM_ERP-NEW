"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (status: string, message: string) => Promise<void>;
}

export default function ChangeTicketStatusModal({
  isOpen,
  onClose,
  onSubmit,
}: Props) {
  const [status, setStatus] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStatus("");
      setMessage("");
      setErrors({});
      setLoading(false);
    }
  }, [isOpen]);

  const validate = () => {
    const newErrors: any = {};
    if (!status) newErrors.status = "Please select status";
    if (!message.trim()) newErrors.message = "Remarks are required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      await onSubmit(status, message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={loading ? () => {} : onClose} className="relative z-60">
      
      {/* BACKDROP */}
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-500/75 transition-opacity
        data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200"
      />

      <div className="fixed inset-0 z-60 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">

          <DialogPanel
            transition
            className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all
            data-[closed]:translate-y-4 data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200
            sm:my-8 sm:w-full sm:max-w-[550px]
            data-[closed]:sm:translate-y-0 data-[closed]:sm:scale-95"
          >
            
            <div className="trezo-card w-full bg-white dark:bg-[#0c1427] p-[20px] md:p-[25px] rounded-md">

              {/* HEADER */}
              <div className="trezo-card-header bg-gray-50 dark:bg-[#15203c] mb-[20px] md:mb-[25px]
              flex items-center justify-between -mx-[20px] md:-mx-[25px] -mt-[20px] md:-mt-[25px]
              p-[20px] md:p-[25px] rounded-t-md">

                <div className="trezo-card-title">
                  <h5 className="!mb-0">
                    Change Ticket Status
                  </h5>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="text-[23px] leading-none text-black dark:text-white hover:text-primary-button-bg transition disabled:opacity-50"
                >
                  <i className="ri-close-fill"></i>
                </button>
              </div>

              {/* BODY */}
              <div className="space-y-5">

                {/* STATUS */}
                <div>
                  <label className="mb-[10px] text-black dark:text-white font-medium block">
                    Status:
                    <span className="text-red-500">*</span>
                  </label>

                  <select
                    disabled={loading}
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className={`h-[55px] rounded-md text-black dark:text-white border px-[17px] w-full outline-0
                    transition-all bg-white dark:bg-[#0c1427]
                    ${
                      errors.status
                        ? "border-red-500"
                        : "border-gray-200 dark:border-[#172036]"
                    }`}
                  >
                    <option value="">Select Status</option>
                    <option value="Open">Open</option>
                    <option value="Working">Working</option>
                    <option value="Closed">Closed</option>
                  </select>

                  {errors.status && (
                    <p className="text-red-500 text-sm mt-1">{errors.status}</p>
                  )}
                </div>

                {/* MESSAGE */}
                <div>
                  <label className="mb-[10px] text-black dark:text-white font-medium block">
                    Remarks:
                    <span className="text-red-500">*</span>
                  </label>

                  <textarea
                    rows={4}
                    disabled={loading}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Enter remarks..."
                    className={`rounded-md text-black dark:text-white border px-[17px] py-[12px] w-full outline-0
                    transition-all resize-none bg-white dark:bg-[#0c1427]
                    ${
                      errors.message
                        ? "border-red-500"
                        : "border-gray-200 dark:border-[#172036]"
                    }`}
                  />

                  {errors.message && (
                    <p className="text-red-500 text-sm mt-1">{errors.message}</p>
                  )}
                </div>
              </div>

              {/* DIVIDER */}
              <hr className="border-0 border-t border-gray-200 dark:border-gray-700 my-6 -mx-[20px] md:-mx-[25px]" />

              {/* FOOTER */}
              <div className="text-right">

                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="mr-[15px] px-[26px] py-[12px] rounded-md bg-danger-500 text-white hover:bg-danger-400 transition disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-[26px] py-[12px] rounded-md bg-primary-button-bg text-white hover:bg-primary-button-bg-hover transition disabled:opacity-70"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="theme-loader"></div>
                      <span>Processing...</span>
                    </div>
                  ) : (
                    "Update Status"
                  )}
                </button>

              </div>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
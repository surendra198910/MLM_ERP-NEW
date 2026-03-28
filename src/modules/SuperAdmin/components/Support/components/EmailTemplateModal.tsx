"use client";

import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { ApiService } from "../../../../../services/ApiService";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  enquiryId: number;
  companyId: number;
  emailId: string;
  employeeId: number;
  onEmailSuccess: () => void;
}

export default function EmailTemplateModal({
  isOpen,
  onClose,
  enquiryId,
  companyId,
  emailId,
  employeeId,
  onEmailSuccess,
}: Props) {
  const { universalService } = ApiService();

  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [templateDetails, setTemplateDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (isOpen) loadTemplates();
  }, [isOpen]);

  const loadTemplates = async () => {
    try {
      setLoading(true);

      const res = await universalService({
        procName: "GetDDLData",
        Para: JSON.stringify({
          tbl: "template.email",
          searchField: "templatename",
          filterCTL: "",
          filterData: encodeURIComponent(
            JSON.stringify({
              FormCategoryId: "9",
              Status: "Active",
              CompanyId: companyId,
            }),
          ),
        }),
      });

      const list = res?.data || res;
      setTemplates(Array.isArray(list) ? list : []);
    } catch {
      Swal.fire("Error", "Failed to load templates", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateChange = async (id: string) => {
    setSelectedId(id);
    setTemplateDetails(null);
    if (!id) return;

    try {
      const res = await universalService({
        procName: "Email",
        Para: JSON.stringify({
          CompanyId: companyId,
          EditId: id,
          ActionMode: "Select",
        }),
      });

      const data = res?.data?.[0] || res?.[0];
      setTemplateDetails(data);
    } catch {
      Swal.fire("Error", "Failed to load template", "error");
    }
  };

  const handleSendEmail = async () => {
    if (!templateDetails) return;

    try {
      setLoading(true);

      const res = await universalService({
        procName: "AddEnquiry",
        Para: JSON.stringify({
          EmailId: emailId,
          CompanyId: companyId,
          TemplateName: templateDetails.TemplateName,
          ActionMode: "SendEmail",
          EditId: enquiryId,
          EntryBy: employeeId,
          EmployeeId: employeeId,
        }),
      });

      const responseData = res?.data || res;
      const result = Array.isArray(responseData)
        ? responseData[0]
        : responseData;

      if (result?.StatusCode === "1") {
        await Swal.fire({
          icon: "success",
          title: "Success",
          text: result?.msg,
          confirmButtonColor: "#2563eb",
        });

        setShowPreview(false);
        onClose();
        onEmailSuccess();
      } else {
        Swal.fire("Error", result?.msg || "Email failed", "error");
      }
    } catch {
      Swal.fire("Error", "Email failed", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-[#1e293b] w-[600px] rounded-xl shadow-2xl overflow-hidden">

        {/* HEADER */}
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-[#2d3a4f] px-6 py-2.5">
          <div className="text-lg font-semibold text-gray-800 dark:text-white">
            Send Email
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 transition"
          >
            ✕
          </button>
        </div>

        {/* BODY */}
        <div className="px-6 py-5 space-y-4">

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Select E-Mail Template
            </label>

            <div className="flex gap-3 mt-1.5">
              <select
                value={selectedId}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="flex-1 border rounded-md px-3 py-2 text-sm bg-white dark:bg-[#0f172a] dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 dark:border-[#334155]"
              >
                <option value="">Select Template Type</option>
                {templates.map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>

              <button
                disabled={!templateDetails}
                onClick={() => setShowPreview(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm disabled:opacity-50"
              >
                View
              </button>
            </div>
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
            onClick={handleSendEmail}
            disabled={!templateDetails || loading}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm transition shadow-sm disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Email"}
          </button>
        </div>
      </div>

      {/* TEMPLATE PREVIEW MODAL */}
      {showPreview && templateDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white dark:bg-[#0f172a] w-[900px] max-w-[95%] h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">

            {/* HEADER */}
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-[#172036] px-6 py-3">
              <div>
                <div className="text-lg font-semibold">
                  {templateDetails.TemplateName}
                </div>
                <p className="text-xs text-gray-500">
                  Subject: {templateDetails.Subject}
                </p>
              </div>

              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-red-500 transition"
              >
                ✕
              </button>
            </div>

            {/* BODY */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-[#1e293b] custom-scrollbar">
              <div
                className="prose max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{
                  __html: templateDetails.EmailContent,
                }}
              />
            </div>

            {/* FOOTER */}
            <div className="flex justify-end gap-3 border-t px-6 py-3 bg-white dark:bg-[#0f172a]">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 bg-gray-200 rounded-md text-sm"
              >
                Close
              </button>

              <button
                onClick={handleSendEmail}
                disabled={loading}
                className="px-5 py-2 bg-blue-600 text-white rounded-md text-sm disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send Email"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
"use client";

import React from "react";
import { FaTimes } from "react-icons/fa";
import Swal from "sweetalert2";

interface DocumentProgressUploaderRowProps {
  doc: {
    DocumentId: number;
    DocumentName: string;
  };

  docState?: {
    number?: string;
    file?: File | null;
    fileName?: string;
    isExisting?: boolean;
  };

  bigInputClasses: string;

  uploadProgress: Record<number, number>;

  setDocValues: React.Dispatch<React.SetStateAction<any>>;

  handleFileUpload: (documentId: number, file?: File) => void;
  openDocument: (fileName?: string) => void;
  removeFileOnly: (documentId: number, documentName: string) => void;
}

const DocumentProgressUploaderRow: React.FC<
  DocumentProgressUploaderRowProps
> = ({
  doc,
  docState,
  bigInputClasses,
  uploadProgress,
  setDocValues,
  handleFileUpload,
  openDocument,
  removeFileOnly,
}) => {
  const confirmRemove = async () => {
    const result = await Swal.fire({
      title: "Remove document?",
      text: `Are you sure you want to remove "${doc.DocumentName}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, remove",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
    });

    if (result.isConfirmed) {
      removeFileOnly(doc.DocumentId, doc.DocumentName);
    }
  };

  return (
    <div className="grid grid-cols-12 px-4 py-4 gap-4 items-start md:items-center border-b border-gray-100 dark:border-gray-700 last:border-0">
      {/* Document Name */}
      <div className="col-span-12 md:col-span-3 text-sm text-gray-800 dark:text-gray-200 font-bold md:font-medium">
        {doc.DocumentName}
      </div>

      {/* Document Number */}
      <div className="col-span-12 md:col-span-4">
        <label className="block md:hidden text-xs text-gray-500 mb-1">
          Document Number
        </label>
        <input
          type="text"
          placeholder="Enter document number"
          className={bigInputClasses}
          value={docState?.number || ""}
          onChange={(e) =>
            setDocValues((prev: any) => ({
              ...prev,
              [doc.DocumentId]: {
                ...prev[doc.DocumentId],
                number: e.target.value,
              },
            }))
          }
        />
      </div>

      {/* Upload Section */}
      <div className="col-span-12 md:col-span-5">
        <label className="block md:hidden text-xs text-gray-500 mb-1">
          Upload File
        </label>

        <div className="flex flex-col md:flex-row md:items-center gap-3 w-full">
          {/* Choose File */}
          <label className="shrink-0 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-xs font-medium rounded-md cursor-pointer whitespace-nowrap text-center transition shadow-sm">
            Choose file
            <input
              type="file"
              hidden
              onChange={(e) =>
                handleFileUpload(doc.DocumentId, e.target.files?.[0])
              }
            />
          </label>

          {/* File Info Box */}
          {(docState?.file || docState?.fileName) && (
            <div className="relative flex-1 min-w-0 flex items-center gap-3 bg-gray-100 dark:bg-gray-800 rounded-md px-3 py-2 border border-gray-200 dark:border-gray-700">
              <div className="flex-1 min-w-0">
                {/* Upload Progress – ONLY for new uploads */}
                {!docState?.isExisting && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase font-bold text-green-600 whitespace-nowrap">
                      {uploadProgress[doc.DocumentId] === 100 ||
                      !uploadProgress[doc.DocumentId]
                        ? "Uploaded"
                        : "Uploading..."}
                    </span>

                    <div className="flex-1 h-[4px] bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-600 transition-all duration-300"
                        style={{
                          width: `${
                            uploadProgress[doc.DocumentId] || 100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* File Name */}
                <p
                  className="text-xs text-primary-600 truncate font-medium cursor-pointer hover:underline"
                  title={docState?.file?.name || docState?.fileName}
                  onClick={() => openDocument(docState?.fileName)}
                >
                  {docState?.file?.name || docState?.fileName}
                </p>
              </div>

              {/* Remove */}
              <button
                type="button"
                onClick={confirmRemove}
                className="shrink-0 text-gray-400 hover:text-red-500 transition p-1"
                title="Remove document"
              >
                <FaTimes size={12} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentProgressUploaderRow;

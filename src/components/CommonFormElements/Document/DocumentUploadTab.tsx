"use client";

import React from "react";
import { FaTimes } from "react-icons/fa";
import Swal from "sweetalert2";

interface DocumentUploadTabProps {
  masterDocuments: any[];
  docValues: Record<number, any>;
  setDocValues: React.Dispatch<React.SetStateAction<any>>;
  uploadProgress: Record<number, number>;
  bigInputClasses: string;

  handleFileUpload: (documentId: number, file?: File) => void;
  openDocument: (fileName?: string) => void;
  removeFileOnly: (documentId: number, documentName: string) => void;
}

const DocumentUploadTab: React.FC<DocumentUploadTabProps> = ({
  masterDocuments,
  docValues,
  setDocValues,
  uploadProgress,
  bigInputClasses,
  handleFileUpload,
  openDocument,
  removeFileOnly,
}) => {
  /** SweetAlert wrapper */
  const confirmRemove = async (
    documentId: number,
    documentName: string
  ) => {
    const result = await Swal.fire({
      title: "Remove document?",
      text: `Are you sure you want to remove "${documentName}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, remove",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
    });

    if (result.isConfirmed) {
      removeFileOnly(documentId, documentName);
    }
  };

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="hidden md:grid bg-gray-50 dark:bg-gray-800 rounded-t-lg border-b border-gray-200 dark:border-gray-700 px-4 py-3 grid-cols-12 gap-4 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
        <div className="col-span-3">Document Name</div>
        <div className="col-span-4">Document Number</div>
        <div className="col-span-5">File</div>
      </div>

      <div className="border border-t-0 border-gray-200 dark:border-gray-700 rounded-b-lg">
        {masterDocuments.map((doc) => {
          const docState = docValues[doc.DocumentId];

          return (
            <div
              key={doc.DocumentId}
              className="grid grid-cols-12 px-4 py-4 gap-4 items-start md:items-center border-b border-gray-100 dark:border-gray-700 last:border-0"
            >
              {/* Name */}
              <div className="col-span-12 md:col-span-3 text-sm text-gray-800 dark:text-gray-200 font-bold md:font-medium">
                {doc.DocumentName}
              </div>

              {/* Number */}
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

              {/* Upload */}
              <div className="col-span-12 md:col-span-5">
                <label className="block md:hidden text-xs text-gray-500 mb-1">
                  Upload File
                </label>

                <div className="flex flex-col md:flex-row md:items-center gap-3 w-full">
                  <label className="shrink-0 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-xs font-medium rounded-md cursor-pointer transition shadow-sm whitespace-nowrap">
                    Choose file
                    <input
                      type="file"
                      hidden
                      onChange={(e) =>
                        handleFileUpload(
                          doc.DocumentId,
                          e.target.files?.[0]
                        )
                      }
                    />
                  </label>

                  {(docState?.file || docState?.fileName) && (
                    <div className="relative flex-1 min-w-0 flex items-center gap-3 bg-gray-100 dark:bg-gray-800 rounded-md px-3 py-2 border border-gray-200 dark:border-gray-700">
                      <div className="flex-1 min-w-0">
                        {!docState?.isExisting && (
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] uppercase font-bold text-green-600">
                              {uploadProgress[doc.DocumentId] === 100 ||
                              !uploadProgress[doc.DocumentId]
                                ? "Uploaded"
                                : "Uploading..."}
                            </span>
                            <div className="flex-1 h-[4px] bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary-600 transition-all"
                                style={{
                                  width: `${
                                    uploadProgress[doc.DocumentId] || 100
                                  }%`,
                                }}
                              />
                            </div>
                          </div>
                        )}

                        <p
                          className="text-xs text-primary-600 truncate font-medium cursor-pointer hover:underline"
                          title={
                            docState?.file?.name || docState?.fileName
                          }
                          onClick={() =>
                            openDocument(docState?.fileName)
                          }
                        >
                          {docState?.file?.name || docState?.fileName}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          confirmRemove(
                            doc.DocumentId,
                            doc.DocumentName
                          )
                        }
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
        })}
      </div>
    </div>
  );
};

export default DocumentUploadTab;

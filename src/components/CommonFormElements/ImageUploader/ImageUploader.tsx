"use client";

import React from "react";
import { FaUserCircle, FaPencilAlt, FaTimes } from "react-icons/fa";
import Swal from "sweetalert2";

interface ImageUploaderProps {
  /** Existing image (from backend) */
  imageUrl?: string;

  /** Preview image (new upload) */
  previewImage?: string;

  /** Loader state */
  loading?: boolean;

  /** Triggered on file select */
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;

  /** Triggered when clicking image */
  onViewImage?: () => void;

  /** Triggered AFTER SweetAlert confirm */
  onDelete: () => void;

  /** Optional title */
  viewTitle?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  imageUrl,
  previewImage,
  loading = false,
  onFileChange,
  onViewImage,
  onDelete,
  viewTitle = "Click to view image",
}) => {
  const confirmDelete = async () => {
    const result = await Swal.fire({
      title: "Remove image?",
      text: "Are you sure you want to remove this image?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, remove",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
    });

    if (result.isConfirmed) {
      onDelete();
    }
  };

  return (
    <div className="w-full md:w-auto flex-shrink-0 flex justify-center md:justify-start">
      <div className="relative w-36 h-36 group">
        {/* Image Box */}
        <div className="w-full h-full rounded-xl border-[4px] border-white dark:border-gray-700 shadow-md overflow-hidden bg-gray-200 dark:bg-gray-800 flex items-center justify-center relative">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Image"
              onClick={onViewImage}
              title={viewTitle}
              className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition"
            />
          ) : previewImage ? (
            <img
              src={previewImage}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <FaUserCircle className="text-7xl text-gray-400 dark:text-gray-600" />
          )}

          {/* Loader */}
          {loading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20">
              <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {!loading && (
          <>
            {/* Edit */}
            <label className="absolute -top-3 -right-3 w-9 h-9 flex items-center justify-center bg-white dark:bg-gray-800 dark:text-primary-400 text-primary-500 rounded-full shadow-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all z-10 border border-gray-100 dark:border-gray-600">
              <FaPencilAlt size={14} />
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={onFileChange}
              />
            </label>

            {/* Delete */}
            {(imageUrl || previewImage) && (
              <button
                type="button"
                onClick={confirmDelete}
                className="absolute -bottom-3 -right-3 w-9 h-9 flex items-center justify-center bg-white dark:bg-gray-800 dark:text-red-400 text-red-400 rounded-full shadow-lg cursor-pointer hover:bg-red-50 dark:hover:bg-gray-700 transition-all z-10 border border-gray-200 dark:border-gray-600"
              >
                <FaTimes size={14} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;

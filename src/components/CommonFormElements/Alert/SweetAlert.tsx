import React from "react";
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from "react-icons/fa";

type AlertType = "success" | "error" | "warning" | "info";

interface SweetAlertProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: AlertType;
  onConfirm?: () => void;
  confirmText?: string;
}

export const SweetAlert: React.FC<SweetAlertProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = "success",
  onConfirm,
  confirmText = "OK",
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "success": return <FaCheckCircle className="text-5xl text-green-500" />;
      case "error": return <FaExclamationCircle className="text-5xl text-red-500" />;
      case "warning": return <FaExclamationCircle className="text-5xl text-yellow-500" />;
      default: return <FaInfoCircle className="text-5xl text-blue-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
      <div className="bg-white dark:bg-[#1a2236] rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center transform transition-all scale-100">
        <div className="mb-4 flex justify-center animate-bounce-short">
          {getIcon()}
        </div>
        
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          {title}
        </h2>
        
        <p className="text-gray-500 dark:text-gray-300 mb-6 text-sm">
          {message}
        </p>
        
        <div className="flex gap-3 justify-center">
          {onConfirm && (
            <button
              onClick={() => { onConfirm(); onClose(); }}
              className="px-6 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition shadow-lg shadow-primary-500/30"
            >
              {confirmText}
            </button>
          )}
          {!onConfirm && (
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white rounded-lg font-medium hover:bg-gray-300 transition"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
import React from "react";
import { FaUndoAlt } from "react-icons/fa";

interface ResetButtonProps {
  label?: string;
  onClick: () => void; // Usually passed as handleReset from Formik
  className?: string;
  disabled?: boolean;
}

export const ResetButton: React.FC<ResetButtonProps> = ({
  label = "Reset",
  onClick,
  className = "",
  disabled = false,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 bg-transparent hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400 border border-red-200 dark:border-red-800 rounded text-sm font-medium transition-colors flex items-center gap-2 ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${className}`}
    >
      <FaUndoAlt className="text-xs" />
      {label}
    </button>
  );
};
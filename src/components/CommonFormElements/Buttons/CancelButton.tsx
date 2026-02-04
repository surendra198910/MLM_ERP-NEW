import React from "react";
import { useNavigate } from "react-router-dom";
import { FaTimes } from "react-icons/fa";

interface CancelButtonProps {
  label?: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export const CancelButton: React.FC<CancelButtonProps> = ({
  label = "Cancel",
  onClick,
  className = "",
  disabled = false,
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(-1); // Default behavior: Go back
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded text-sm font-medium transition-colors flex items-center gap-2 border border-gray-200 dark:border-gray-600 ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${className}`}
    >
      <FaTimes className="text-xs" />
      {label}
    </button>
  );
};
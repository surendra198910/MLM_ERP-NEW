import React from "react";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  title: string;
  onBack?: () => void;
  actionButton?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, onBack, actionButton }) => {
  const navigate = useNavigate();
  
  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  return (
    <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4 py-4 mb-4">
      <div className="text-lg font-bold text-gray-800 dark:text-white">
        {title}
      </div>
      <div className="flex gap-x-2">
        <button
          type="button"
          onClick={handleBack}
          className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-sm font-medium transition-colors"
        >
          Back
        </button>
        {actionButton}
      </div>
    </div>
  );
};
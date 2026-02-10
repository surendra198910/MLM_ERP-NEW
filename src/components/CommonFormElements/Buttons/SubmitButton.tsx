import React from "react";

interface SubmitButtonProps {
  label: string;
  loading?: boolean;
  onClick?: () => void; // Optional if type is submit inside form
}

export const SubmitButton: React.FC<SubmitButtonProps> = ({ label, loading, onClick }) => {
  return (
    <button
      type="submit"
      onClick={onClick}
      disabled={loading}
      className={`px-6 py-2 bg-primary-button-bg hover:bg-primary-button-bg-hover text-white rounded text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
        loading ? "opacity-70 cursor-not-allowed" : ""
      }`}
    >
      {loading && (
        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
      )}
      {label}
    </button>
  );
};
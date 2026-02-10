import React from "react";

interface SubHeaderProps {
  title: string;
  subtitle?: string;
}

export const SubHeader: React.FC<SubHeaderProps> = ({ title, subtitle }) => {
  return (
    <div className="mb-4 mt-6 border-l-4 border-primary-button-bg pl-3">
      <p className="text-md font-semibold text-gray-800 dark:text-white">{title}</p>
      {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
    </div>
  );
};
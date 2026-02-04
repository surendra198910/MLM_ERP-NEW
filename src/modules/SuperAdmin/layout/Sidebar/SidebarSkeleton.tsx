import React from "react";

type Props = {
  items?: number;
};

const SidebarSkeleton: React.FC<Props> = ({ items = 20 }) => {
  return (
    <div className="animate-pulse space-y-3 px-2">
      {/* MAIN MENU title */}
      <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-4" />

      {[...Array(items)].map((_, i) => (
        <div key={i} className="space-y-2">
          {/* Parent Item */}
          <div className="flex items-center gap-3 px-2 py-2 rounded-md">
            <div className="h-5 w-5 rounded bg-gray-300 dark:bg-gray-600" />
            <div className="h-4 w-32 bg-gray-300 dark:bg-gray-600 rounded" />
          </div>

          {/* Child Items (fake indentation) */}
          <div className="ml-8 space-y-2">
            <div className="h-3 w-28 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default SidebarSkeleton;

import React from "react";

const CardSkeleton = ({ size = "module" }: { size?: "module" | "tool" }) => {
  const isModule = size === "module";

  return (
    <div
      className={`
        animate-pulse rounded-xl bg-white dark:bg-gray-800 shadow-sm
        flex flex-col items-center justify-center
        ${isModule ? "w-full max-w-[170px] h-[170px]" : "w-full max-w-[130px] h-[124px]"}
      `}
    >
      {/* Icon circle */}
      <div
        className={`
          rounded-full bg-gray-200 dark:bg-gray-700
          ${isModule ? "w-12 h-12 mb-3" : "w-10 h-10 mb-5 mt-3"}
        `}
      />

      {/* Title */}
      <div className="h-3 w-20 bg-gray-300 dark:bg-gray-600 rounded mb-2" />

      {/* Description (modules only) */}
      {isModule && (
        <div className="space-y-1">
          <div className="h-2 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-2 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      )}
    </div>
  );
};

const LandingPageSkeletonLoading = () => {
  return (
    <div className="p-0 min-h-screen dark:bg-gray-900 mb-8 animate-pulse">
      {/* HEADER */}
      <div className="px-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        <div className="h-6 w-64 bg-gray-300 dark:bg-gray-600 rounded mb-2" />
        <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
      </div>

      {/* MODULES GRID */}
      <div className="grid grid-cols-8 gap-4 max-xl:grid-cols-4 max-lg:grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1 place-items-center">
        {Array.from({ length: 8 }).map((_, i) => (
          <CardSkeleton key={i} size="module" />
        ))}
      </div>

      {/* TOOLS HEADER */}
      <div className="mt-10 mb-3 px-2">
        <div className="h-5 w-24 bg-gray-300 dark:bg-gray-600 rounded mb-2" />
        <div className="h-[1px] bg-gray-200 dark:bg-gray-700" />
      </div>

      {/* TOOLS GRID */}
      <div className="grid grid-cols-10 gap-4 max-xl:grid-cols-4 max-lg:grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1 place-items-center">
        {Array.from({ length: 10 }).map((_, i) => (
          <CardSkeleton key={i} size="tool" />
        ))}
      </div>
    </div>
  );
};

export default LandingPageSkeletonLoading;

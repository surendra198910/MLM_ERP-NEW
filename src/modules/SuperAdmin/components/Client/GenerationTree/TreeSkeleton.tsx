import React from "react";

const TreeSkeleton = () => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center min-h-[500px] animate-pulse">
      {/* Root Node */}
      <div className="w-32 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg mb-8"></div>
      
      {/* Connector Line */}
      <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mb-8"></div>

      {/* Children Nodes */}
      <div className="flex gap-16">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="w-28 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 my-4"></div>
            <div className="flex gap-4">
              <div className="w-16 h-8 bg-gray-100 dark:bg-gray-800 rounded-md"></div>
              <div className="w-16 h-8 bg-gray-100 dark:bg-gray-800 rounded-md"></div>
            </div>
          </div>
        ))}
      </div>
      
      <p className="mt-10 text-gray-400 font-medium">Generating Tree Hierarchy...</p>
    </div>
  );
};

export default TreeSkeleton;
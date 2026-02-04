import React from "react";

const Loader: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-[400px] bg-white dark:bg-[#0c1427] rounded-md">
      <div className="flex flex-col items-center gap-3">
        {/* Loader Ring */}
        <div className="theme-loader border-primary-button-bg"></div>
      </div>
    </div>
  );
};

export default Loader;

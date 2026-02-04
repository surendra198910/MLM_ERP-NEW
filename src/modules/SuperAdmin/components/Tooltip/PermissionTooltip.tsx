import React from "react";

type PermissionTooltipProps = {
  text?: string;
  children: React.ReactNode;
};

const PermissionTooltip: React.FC<PermissionTooltipProps> = ({
  text = "You do not have permission to perform this action",
  children,
}) => {
  return (
    <div className="relative group inline-flex">
      {children}

      {/* Tooltip Container */}
      <div
        className="
          absolute bottom-full mb-2 right-0 
          pointer-events-none opacity-0 group-hover:opacity-100 
          transition-opacity z-[100]
        "
      >
        <div className="bg-red-600 text-white text-xs font-medium px-3 py-1.5 rounded-md shadow-xl whitespace-nowrap relative">
          {text}

          {/* Arrow - Positioned to the right to match the icon below */}
          <div
            className="
              absolute top-full right-2
              w-0 h-0
              border-l-[6px] border-r-[6px] border-t-[6px]
              border-l-transparent border-r-transparent border-t-red-600
            "
          />
        </div>
      </div>
    </div>
  );
};

export default PermissionTooltip;
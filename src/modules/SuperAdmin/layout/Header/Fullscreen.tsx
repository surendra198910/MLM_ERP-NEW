import React, { useState } from "react";

const Fullscreen: React.FC = () => {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const handleToggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error(
          `Error toggling full-screen mode: ${err.message} (${err.name})`
        );
      } else {
        console.error(
          "Unknown error occurred while toggling full-screen mode."
        );
      }
    }
  };

  return (
    <div className="relative group mx-[8px] md:mx-[10px] lg:mx-[12px] inline-block">
      <button
        type="button"
        onClick={handleToggleFullscreen}
        aria-label={isFullscreen ? "Exit full screen" : "Enter full screen"}
        className="leading-none inline-block transition-all
                   relative top-[2px]
                   hover:text-primary-500"
      >
        <i className="material-symbols-outlined !text-[22px] md:!text-[24px]">
          {isFullscreen ? "fullscreen_exit" : "fullscreen"}
        </i>
      </button>

      {/* TOOLTIP */}
      <div
        className="absolute left-1/2 -translate-x-1/2 -bottom-[38px]
                   px-2 py-1 text-xs rounded
                   bg-gray-800 text-white
                   opacity-0 group-hover:opacity-100
                   transition-opacity
                   whitespace-nowrap
                   pointer-events-none"
      >
        {isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}

        {/* ARROW */}
        <div
          className="absolute -top-1 left-1/2 -translate-x-1/2
                     w-0 h-0
                     border-l-4 border-r-4 border-b-4
                     border-l-transparent
                     border-r-transparent
                     border-b-gray-800"
        />
      </div>
    </div>
  );
};

export default Fullscreen;

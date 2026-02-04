import React from "react";
import { useNavigate } from "react-router-dom";

const Welcomebutton = () => {
  const navigate = useNavigate();
  return (
    <>
      <div className="relative group inline-block">
        <button
          className="inline-flex items-center gap-1 py-[1px] px-[1px] bg-primary-button-bg text-white 
               transition-all hover:bg-button-bg-hover rounded-md border border-primary-button-bg 
               hover:border-primary-button-bg-hover"
          type="button"
          onClick={() => navigate("/welcome")}
        >
          <i className="ri-arrow-left-line text-[20px]"></i>
        </button>

        {/* Tooltip */}
        <div
          className="absolute left-1/2 -translate-x-1/2 -bottom-[37px] 
               px-2 py-1 text-xs rounded bg-gray-800 text-white 
               opacity-0 group-hover:opacity-100 transition-opacity
               whitespace-nowrap"
        >
          Go to welcome page
          {/* Arrow */}
          <div
            className="absolute -top-1 left-1/2 -translate-x-1/2
                    w-0 h-0 
                    border-l-4 border-r-4 border-b-4 
                    border-l-transparent border-r-transparent border-b-gray-800"
          ></div>
        </div>
      </div>
    </>
  );
};

export default Welcomebutton;

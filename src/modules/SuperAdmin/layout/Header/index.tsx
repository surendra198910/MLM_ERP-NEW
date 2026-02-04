import React, { useEffect } from "react";
import Settings from "./Settings/index";
import DarkMode from "./DarkMode";
import SearchForm from "./SearchForm/index";
import AppsMenu from "./AppsMenu";
import ChooseLanguage from "./ChooseLanguage";
import Fullscreen from "./Fullscreen";
import Notifications from "./Notifications";
import ProfileMenu from "./ProfileMenu";
import Welcomebutton from "./Welcomebutton";
import CompanyInfo from "./CompanyInfo";
import CompanyTools from "./CompanyTools";
import SearchPopup from "./SearchPopup";

interface HeaderProps {
  toggleActive: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleActive }) => {
  useEffect(() => {
    const elementId = document.getElementById("header");
    const handleScroll = () => {
      if (window.scrollY > 100) {
        elementId?.classList.add("shadow-sm");
      } else {
        elementId?.classList.remove("shadow-sm");
      }
    };

    document.addEventListener("scroll", handleScroll);

    // Cleanup event listener on component unmount
    return () => {
      document.removeEventListener("scroll", handleScroll);
    };
  }, []); // Added empty dependency array to avoid repeated effect calls

  return (
    <>
      <div
        id="header"
        className="header-area bg-white dark:bg-[#0c1427] py-[13px] px-[20px] md:px-[25px] fixed top-0 rounded-b-md transition-all z-[50]"
      >
        <div className="md:flex md:items-center md:justify-between">
          <div className="z-50 flex items-center justify-center md:justify-normal">
            <div className="relative group inline-block leading-none top-px ltr:mr-[13px] ltr:md:mr-[18px] ltr:lg:mr-[23px] rtl:ml-[13px] rtl:md:ml-[18px] rtl:lg:ml-[23px]">
              <button
                type="button"
                className="hide-sidebar-toggle transition-all inline-block hover:text-primary-500"
                onClick={toggleActive}
              >
                <i className="material-symbols-outlined !text-[20px]">menu</i>
              </button>
              <div
                className="absolute left-1/2 -translate-x-1/2 -bottom-[38px]
               px-2 py-1 text-xs rounded
               bg-gray-800 text-white
               opacity-0 group-hover:opacity-100
               transition-opacity
               whitespace-nowrap
               pointer-events-none"
              >
                Toggle sidebar
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

            {/* <SearchForm /> */}
            <CompanyInfo />

            {/* <AppsMenu /> */}
            <CompanyTools />
          </div>

          <div className="flex items-center justify-center md:justify-normal mt-[13px] md:mt-0">
            <Welcomebutton />

            <SearchPopup />

            <DarkMode />

            <ChooseLanguage />

            <Fullscreen />

            <Notifications />

            <ProfileMenu />

            <Settings />
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;

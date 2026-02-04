import React, { useState } from "react";
import { BrowserRouter as Router, useLocation } from "react-router-dom";

import Header from "./components/Layout/Header";
import SidebarMenu from "./components/Layout/SidebarMenu";
import Footer from "./components/Layout/Footer";

import AppRoutes from "./routes/AppRoutes";
import SuperAdminAppRoutes from "./modules/SuperAdmin/routes/AppRoutes";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";




const AppLayout: React.FC = () => {
  const location = useLocation();
  const [active, setActive] = useState(false);

  const toggleActive = () => setActive(!active);

  // ✅ Detect Module Route
  const isCRM = location.pathname.startsWith("/crm");
  const isLMS = location.pathname.startsWith("/lms");
  const isHMS = location.pathname.startsWith("/hms");
  const isRestaurant = location.pathname.startsWith("/restaurant");
  const isEcommerce = location.pathname.startsWith("/ecommerce");
  const isProjectManagement = location.pathname.startsWith("/project-management");
  const isPOSSystem = location.pathname.startsWith("/pos-system");
  const isSchoolManagement = location.pathname.startsWith("/school-management");
  const isHRMS = location.pathname.startsWith("/hrms");
  const isSales = location.pathname.startsWith("/sales");
  const isHelpDesk = location.pathname.startsWith("/helpdesk");
  const isMarketing = location.pathname.startsWith("/marketing");
  const isCallCenter = location.pathname.startsWith("/call-center");
  const isNFT = location.pathname.startsWith("/nft");
  const isSuperAdmin = location.pathname.startsWith("/superadmin");
  

  // ✅ Pages Without Layout
  const noLayoutPages = [
    "/authentication/sign-in",
    "/authentication/sign-up",
    "/authentication/forgot-password",
    "/authentication/reset-password",
    "/authentication/confirm-email",
    "/authentication/lock-screen",
    "/authentication/logout",
    "/coming-soon",
    "/",
    "/front-pages/features",
    "/front-pages/team",
    "/front-pages/faq",
    "/front-pages/contact",
  ];

const isNoLayout = noLayoutPages.includes(location.pathname);

  if (isSuperAdmin) {
    return <SuperAdminAppRoutes />;
  }

  return (
    <div className={`main-content-wrap transition-all ${active ? "active" : ""}`}>
      {!isNoLayout && <SidebarMenu toggleActive={toggleActive} />}

      <div className="main-content flex flex-col overflow-hidden min-h-screen">
        {!isNoLayout && <Header toggleActive={toggleActive} />}

        <AppRoutes />
<ToastContainer />
        {!isNoLayout && <Footer />}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
};

export default App;

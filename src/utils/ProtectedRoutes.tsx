import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {
  const token = localStorage.getItem("authtoken");

  // ✅ If not logged in → redirect
  if (!token) {
    return <Navigate to="/authentication/sign-in" replace />;
  }

  // ✅ If logged in → allow access
  return <Outlet />;
};

export default ProtectedRoute;

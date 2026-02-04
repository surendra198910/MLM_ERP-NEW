import React, { createContext, useState, useEffect, useContext } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState({});

  // Load token and user profile on app mount
  useEffect(() => {
    const token = localStorage.getItem("Token");
    const storedProfile = JSON.parse(localStorage.getItem("adnexaPublisherInfo"));

    if (token) setIsAuthenticated(true);
    if (storedProfile) setUserProfile(storedProfile); 
    setLoading(false);
  }, []);

  // Login function
  const login = (publisherInfo, token) => {
    localStorage.setItem("Token", token);
    localStorage.setItem("adnexaPublisherInfo", JSON.stringify(publisherInfo)); 
    setIsAuthenticated(true);
    setUserProfile(publisherInfo); 
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("Token");
    localStorage.removeItem("adnexaPublisherInfo");
    localStorage.removeItem("PublisherUserID");
    setIsAuthenticated(false);
    setUserProfile({});
  };

  // Update user profile (e.g., after editing profile)
  const updateUserProfile = (updatedProfile) => {
    setUserProfile(updatedProfile);
    localStorage.setItem("adnexaPublisherInfo", JSON.stringify(updatedProfile)); 
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        loading,
        login,
        logout,
        userProfile,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for easy access
export const useAuth = () => useContext(AuthContext);

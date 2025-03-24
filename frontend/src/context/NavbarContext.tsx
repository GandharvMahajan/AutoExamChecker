import React, { createContext, useContext, useState, ReactNode } from 'react';

interface NavbarContextType {
  showNavbar: boolean;
  setShowNavbar: (show: boolean) => void;
}

const defaultContext: NavbarContextType = {
  showNavbar: true,
  setShowNavbar: () => {},
};

const NavbarContext = createContext<NavbarContextType>(defaultContext);

export const useNavbar = () => useContext(NavbarContext);

export const NavbarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [showNavbar, setShowNavbar] = useState(true);

  return (
    <NavbarContext.Provider value={{ showNavbar, setShowNavbar }}>
      {children}
    </NavbarContext.Provider>
  );
}; 
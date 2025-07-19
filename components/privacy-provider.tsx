"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface PrivacyContextType {
  isPrivate: boolean;
  togglePrivacy: () => void;
  setPrivacy: (isPrivate: boolean) => void;
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

export function usePrivacy() {
  const context = useContext(PrivacyContext);
  if (context === undefined) {
    throw new Error("usePrivacy must be used within a PrivacyProvider");
  }
  return context;
}

interface PrivacyProviderProps {
  children: React.ReactNode;
}

export function PrivacyProvider({ children }: PrivacyProviderProps) {
  const [isPrivate, setIsPrivate] = useState(true);

  // Load privacy state from localStorage on mount
  useEffect(() => {
    const savedPrivacy = localStorage.getItem("cashflow-privacy-mode");
    if (savedPrivacy !== null) {
      setIsPrivate(JSON.parse(savedPrivacy));
    }
  }, []);

  // Save privacy state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cashflow-privacy-mode", JSON.stringify(isPrivate));
  }, [isPrivate]);

  const togglePrivacy = () => {
    setIsPrivate(prev => !prev);
  };

  const setPrivacy = (isPrivate: boolean) => {
    setIsPrivate(isPrivate);
  };

  const value = {
    isPrivate,
    togglePrivacy,
    setPrivacy,
  };

  return (
    <PrivacyContext.Provider value={value}>
      {children}
    </PrivacyContext.Provider>
  );
} 
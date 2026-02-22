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
  const [isPrivate, setIsPrivate] = useState(() => {
    if (typeof window === "undefined") return true;
    const savedPrivacy = localStorage.getItem("cashflow-privacy-mode");
    return savedPrivacy !== null ? JSON.parse(savedPrivacy) : true;
  });

  // Save privacy state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cashflow-privacy-mode", JSON.stringify(isPrivate));
  }, [isPrivate]);

  const togglePrivacy = () => {
    setIsPrivate((prev: boolean) => !prev);
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
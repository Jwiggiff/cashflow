"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface PrivacyContextType {
  isPrivate: boolean;
  togglePrivacy: () => void;
  setPrivacy: (isPrivate: boolean) => void;
  isLoading: boolean;
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
  const [isLoading, setIsLoading] = useState(true);

  // Load privacy state from localStorage on mount
  useEffect(() => {
    const savedPrivacy = localStorage.getItem("cashflow-privacy-mode");
    if (savedPrivacy !== null) {
      setIsPrivate(JSON.parse(savedPrivacy));
    }
    setIsLoading(false);
  }, []);

  // Save privacy state to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem("cashflow-privacy-mode", JSON.stringify(isPrivate));
    }
  }, [isPrivate, isLoading]);

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
    isLoading,
  };

  return (
    <PrivacyContext.Provider value={value}>
      {children}
    </PrivacyContext.Provider>
  );
} 
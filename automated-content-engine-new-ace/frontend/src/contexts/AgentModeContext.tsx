"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface AgentModeContextType {
  isDeveloperMode: boolean;
  toggleMode: () => void;
  canToggle: boolean;
}

const AgentModeContext = createContext<AgentModeContextType | undefined>(
  undefined
);

export function AgentModeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isDeveloperMode, setIsDeveloperMode] = useState(false);

  const canToggle = Boolean(user?.isAdmin);

  useEffect(() => {
    if (canToggle) {
      const savedMode = localStorage.getItem("agent_developer_mode");
      if (savedMode === "true") {
        setIsDeveloperMode(true);
      }
    } else {
      setIsDeveloperMode(false);
    }
  }, [canToggle]);

  const toggleMode = () => {
    if (!canToggle) return;

    const newMode = !isDeveloperMode;
    setIsDeveloperMode(newMode);
    localStorage.setItem("agent_developer_mode", newMode.toString());
  };

  return (
    <AgentModeContext.Provider
      value={{
        isDeveloperMode,
        toggleMode,
        canToggle,
      }}
    >
      {children}
    </AgentModeContext.Provider>
  );
}

export function useAgentMode() {
  const context = useContext(AgentModeContext);
  if (context === undefined) {
    throw new Error("useAgentMode must be used within an AgentModeProvider");
  }
  return context;
}

"use client";

import React from "react";
import { Code, Eye } from "lucide-react";
import { useAgentMode } from "@/contexts/AgentModeContext";

export function AgentModeToggle() {
  const { isDeveloperMode, toggleMode, canToggle } = useAgentMode();

  if (!canToggle) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">View:</span>
      <div className="flex items-center bg-muted rounded-md p-1">
        <button
          onClick={() => !isDeveloperMode || toggleMode()}
          className={`
            flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all
            ${
              !isDeveloperMode
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }
          `}
          title="User Mode - Clean polished view"
        >
          <Eye className="h-3 w-3" />
          <span>User</span>
        </button>
        <button
          onClick={() => isDeveloperMode || toggleMode()}
          className={`
            flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all
            ${
              isDeveloperMode
                ? "bg-accent text-black shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }
          `}
          title="Developer Mode - Show scaffolding and debug info"
        >
          <Code className="h-3 w-3" />
          <span>Dev</span>
        </button>
      </div>
    </div>
  );
}

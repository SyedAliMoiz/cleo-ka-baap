import React from "react";
import Link from "next/link";
import { useDarkMode } from "../DarkModeProvider";

export function Logo() {
  const { isDarkMode } = useDarkMode();

  return (
    <Link href="/" className="flex items-center gap-2 group">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-display text-sm">
        V
      </div>
      <span
        className={`text-xl font-display group-hover:text-primary transition-colors ${
          isDarkMode ? "text-gray-200" : "text-gray-800"
        }`}
      >
        VyraLab
      </span>
    </Link>
  );
}

import React, { useState } from "react";
import { useDarkMode } from "../DarkModeProvider";
import { useAuth } from "../AuthProvider";
import clsx from "clsx";

export function UserMenu() {
  const { isDarkMode } = useDarkMode();
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen((prev) => !prev);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
  };

  return (
    <div className="flex items-center ml-4">
      <div className="relative">
        {/* Avatar Button */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            toggleMenu();
          }}
          className={clsx(
            "w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-purple-500 transition-all",
            isDarkMode
              ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
              : "bg-gray-200 hover:bg-gray-100 text-gray-700"
          )}
        >
          <span className="text-sm font-medium">A</span>
        </div>

        {/* Dropdown Menu */}
        {menuOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            className={clsx(
              "absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 z-10 border",
              isDarkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            )}
          >
            <button
              onClick={handleLogout}
              className={clsx(
                "block w-full text-left px-4 py-2 text-sm",
                isDarkMode
                  ? "text-gray-300 hover:bg-gray-700"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

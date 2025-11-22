import React, { useState, useEffect } from "react";
import { useDarkMode } from "../DarkModeProvider";
import { Logo } from "./Logo";
import { NavLink } from "./NavLink";
import { DarkModeToggle } from "./DarkModeToggle";
import { UserMenu } from "./UserMenu";
import { IconMenu2, IconX } from "@tabler/icons-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isDarkMode } = useDarkMode();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when screen size changes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      className={`flex flex-col h-screen w-full transition-colors duration-200 ${
        isDarkMode ? "bg-gray-900 text-white" : "bg-white text-black"
      }`}
    >
      {/* Top Header Bar */}
      <header
        className={`h-16 flex items-center justify-between px-2 sm:px-4 transition-colors duration-200 ${
          isDarkMode
            ? "border-b border-gray-700 bg-gray-900"
            : "border-b border-gray-200 bg-gray-50 shadow-sm"
        }`}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <Logo />
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {/* Navigation Links - Hidden on mobile, shown on desktop */}
          <nav className="hidden lg:flex items-center gap-1">
            <NavLink href="/clients">Clients</NavLink>
            <NavLink href="/chats" activePaths={["/chats", "/threads"]}>
              Chats
            </NavLink>
            <NavLink href="/thread-writer">Thread Writer</NavLink>
            <NavLink href="/hooks">Hook Polisher</NavLink>
            <NavLink href="/linkedin-posts">LinkedIn Posts</NavLink>
            <NavLink href="/prompts">Prompt Editor</NavLink>
            <NavLink href="/custom-gpts">GPT Playground</NavLink>
          </nav>

          {/* Mobile Hamburger Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`lg:hidden p-2 rounded-md transition-colors duration-200 ${
              isDarkMode
                ? "hover:bg-gray-700 text-gray-300"
                : "hover:bg-gray-100 text-gray-600"
            }`}
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <IconX size={20} /> : <IconMenu2 size={20} />}
          </button>

          <DarkModeToggle />

          <UserMenu />
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Menu Drawer */}
          <div
            className={`absolute top-0 right-0 h-full w-80 max-w-[85vw] ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            } shadow-xl transform transition-transform duration-300 ease-in-out`}
          >
            <div className="flex flex-col h-full">
              {/* Menu Header */}
              <div
                className={`flex items-center justify-between p-4 border-b ${
                  isDarkMode ? "border-gray-700" : "border-gray-200"
                }`}
              >
                <h2
                  className={`text-lg font-semibold ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Navigation
                </h2>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`p-2 rounded-md transition-colors duration-200 ${
                    isDarkMode
                      ? "hover:bg-gray-700 text-gray-300"
                      : "hover:bg-gray-100 text-gray-600"
                  }`}
                >
                  <IconX size={20} />
                </button>
              </div>

              {/* Menu Links */}
              <nav className="flex-1 p-4 space-y-2">
                <NavLink
                  href="/clients"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block"
                >
                  Clients
                </NavLink>
                <NavLink
                  href="/chats"
                  activePaths={["/chats", "/threads"]}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block"
                >
                  Chats
                </NavLink>
                <NavLink
                  href="/thread-writer"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block"
                >
                  Thread Writer
                </NavLink>
                <NavLink
                  href="/hooks"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block"
                >
                  Hook Polisher
                </NavLink>
                <NavLink
                  href="/linkedin-posts"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block"
                >
                  LinkedIn Posts
                </NavLink>
                <NavLink
                  href="/prompts"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block"
                >
                  Prompt Editor
                </NavLink>
                <NavLink
                  href="/custom-gpts"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block"
                >
                  GPT Playground
                </NavLink>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main
        className={`flex-1 overflow-auto p-2 sm:p-4 lg:p-6 transition-colors duration-200 ${
          isDarkMode ? "bg-gray-800" : "bg-white"
        }`}
      >
        {children}
      </main>
    </div>
  );
}

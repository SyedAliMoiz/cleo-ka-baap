import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDarkMode } from "../DarkModeProvider";
import clsx from "clsx";

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  activePaths?: string[];
  onClick?: () => void;
  className?: string;
}

export function NavLink({
  href,
  children,
  activePaths,
  onClick,
  className,
}: NavLinkProps) {
  const pathname = usePathname();
  const { isDarkMode } = useDarkMode();

  const isActive = activePaths
    ? activePaths.some((path) => pathname?.startsWith(path))
    : pathname?.startsWith(href);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={clsx(
        "px-3 py-2 text-sm font-medium rounded-md transition-colors",
        className,
        {
          // Active state
          "bg-purple-50 text-purple-700": isActive && !isDarkMode,
          "bg-purple-900/70 text-white": isActive && isDarkMode,

          // Inactive state
          "text-gray-700 hover:text-purple-700 hover:bg-purple-50":
            !isActive && !isDarkMode,
          "text-gray-300 hover:text-white hover:bg-purple-900/50":
            !isActive && isDarkMode,
        }
      )}
    >
      {children}
    </Link>
  );
}

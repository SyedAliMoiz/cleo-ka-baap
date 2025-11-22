"use client";

import React, { PropsWithChildren } from "react";
import { Logo } from "./Logo/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { AgentModeToggle } from "@/components/AgentModeToggle";
import Link from "next/link";
import HeaderUserInfo from "./HeaderUserInfo/HeaderUserInfo";

function AdminButton() {
  return (
    <Link href="/admin">
      <button className="cursor-pointer px-3 py-1.5 bg-primary/80 hover:bg-primary text-primary-foreground rounded-md text-sm transition-colors font-semibold">
        Admin Dashboard
      </button>
    </Link>
  );
}

function Header() {
  const { user, logout, isLoading } = useAuth();

  return (
    <header className="h-20 flex items-center justify-between px-6 sm:px-12 lg:px-16 xl:px-20 transition-colors duration-200 border-b border-white/10 bg-black/40 backdrop-blur supports-[backdrop-filter]:bg-black/40">
      <div className="flex items-center gap-2 sm:gap-3">
        <Logo />
        {user?.isAdmin && <AdminButton />}
      </div>
      <div className="flex items-center gap-3">
        <AgentModeToggle />
        {!isLoading && user && <HeaderUserInfo user={user} logout={logout} />}
        {!isLoading && !user && (
          <Link
            href="/login"
            className="px-3 py-1.5 bg-primary/80 hover:bg-primary text-primary-foreground rounded-md text-sm transition-colors font-semibold"
          >
            Login
          </Link>
        )}
      </div>
    </header>
  );
}

function DashboardLayout({ children }: PropsWithChildren) {
  return (
    <>
      <Header />
      {children}
    </>
  );
}

export default DashboardLayout;

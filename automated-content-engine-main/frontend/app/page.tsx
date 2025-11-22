"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "../src/components/DashboardLayout/DashboardLayout";
import { Dashboard } from "../src/components/Dashboard";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-12 w-12 rounded-full bg-primary/30"></div>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <Dashboard />
    </DashboardLayout>
  );
}

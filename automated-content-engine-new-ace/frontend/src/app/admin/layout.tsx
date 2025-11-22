"use client";

import { AdminRoute } from "@/components/ProtectedRoute";

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AdminRoute>{children}</AdminRoute>;
}

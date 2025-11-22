"use client";

import Link from "next/link";

export default function AdminHome() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <div className="space-x-4">
        <Link href="/admin/users" className="underline">
          Manage Users
        </Link>
        <Link href="/admin/modules" className="underline">
          Manage Modules
        </Link>
      </div>
    </div>
  );
}

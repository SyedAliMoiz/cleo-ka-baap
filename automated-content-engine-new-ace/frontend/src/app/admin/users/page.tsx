"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/helpers/networking";

interface UserRow {
  _id: string;
  email: string;
  isAdmin: boolean;
  tier: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get("/users");
        setUsers(res.data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Users</h1>
        <Link href="/admin/users/new" className="underline">
          Add User
        </Link>
      </div>
      <div className="space-y-2">
        {users.map((u) => (
          <div
            key={u._id}
            className="flex items-center justify-between border border-border rounded p-3 bg-card hover:border-[rgba(0,255,136,0.3)] transition-colors"
          >
            <div className="space-y-1">
              <div className="font-medium">{u.email}</div>
              <div className="text-sm text-muted-foreground">
                {u.isAdmin ? "Admin" : "User"} · Tier: {u.tier}
              </div>
            </div>
            <div className="space-x-3">
              <Link
                href={`/admin/users/${u._id}`}
                className="text-primary hover:text-accent underline"
              >
                Edit
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

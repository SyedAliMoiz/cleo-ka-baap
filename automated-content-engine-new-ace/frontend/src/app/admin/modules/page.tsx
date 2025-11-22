"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronUp, ChevronDown } from "lucide-react";
import { apiClient, updateModulePositions } from "@/helpers/networking";

interface ModuleRow {
  _id: string;
  name: string;
  slug: string;
  tier: string;
  isActive: boolean;
  position: number;
  isRecommended: boolean;
}

export default function AdminModulesPage() {
  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get("/modules/all");
        setModules(res.data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleMove = async (index: number, direction: "up" | "down") => {
    if (saving) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= modules.length) return;

    const updatedModules = [...modules];
    const [movedModule] = updatedModules.splice(index, 1);
    updatedModules.splice(newIndex, 0, movedModule);

    // Update positions based on new order
    const positionUpdates = updatedModules.map((module, idx) => ({
      id: module._id,
      position: idx,
    }));

    setModules(updatedModules);
    setSaving(true);

    try {
      await updateModulePositions(positionUpdates);
    } catch (error) {
      console.error("Failed to update positions:", error);
      // Revert on error
      const res = await apiClient.get("/modules/all");
      setModules(res.data);
    } finally {
      setSaving(false);
    }
  };

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
        <h1 className="text-xl font-semibold">Modules</h1>
        <Link
          href="/admin/modules/create"
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm font-semibold transition-colors"
        >
          Create Module
        </Link>
      </div>
      <div className="space-y-2">
        {modules.map((m, index) => (
          <div
            key={m._id}
            className="flex items-center justify-between border border-border rounded p-3 bg-card hover:border-[rgba(0,255,136,0.3)] transition-colors"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => handleMove(index, "up")}
                  disabled={index === 0 || saving}
                  className="p-1 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Move up"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleMove(index, "down")}
                  disabled={index === modules.length - 1 || saving}
                  className="p-1 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Move down"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-1 flex-1">
                <div className="font-medium flex items-center gap-2">
                  {m.name}
                  {m.isRecommended && (
                    <span className="text-xs px-2 py-0.5 rounded bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/30">
                      Recommended
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {m.tier} · {m.isActive ? "Active" : "Inactive"} · Position:{" "}
                  {m.position}
                </div>
              </div>
            </div>
            <div className="space-x-3">
              <Link
                href={`/admin/modules/${m._id}`}
                className="text-primary hover:text-accent underline"
              >
                Edit
              </Link>
            </div>
          </div>
        ))}
      </div>
      {saving && (
        <div className="text-sm text-muted-foreground text-center">
          Saving positions...
        </div>
      )}
    </div>
  );
}

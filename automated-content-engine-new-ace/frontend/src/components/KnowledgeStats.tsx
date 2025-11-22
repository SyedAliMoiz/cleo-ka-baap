"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Layers, HardDrive } from "lucide-react";

interface KnowledgeStats {
  fileCount: number;
  totalChunks: number;
  totalSize: number;
}

interface KnowledgeStatsProps {
  stats: KnowledgeStats | null;
}

export function KnowledgeStats({ stats }: KnowledgeStatsProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (!stats) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Knowledge Base Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg">Knowledge Base Stats</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-lg">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {stats.fileCount}
            </p>
            <p className="text-sm text-muted-foreground">Files</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/20 rounded-lg">
            <Layers className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {stats.totalChunks}
            </p>
            <p className="text-sm text-muted-foreground">Chunks</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-lg">
            <HardDrive className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {formatFileSize(stats.totalSize)}
            </p>
            <p className="text-sm text-muted-foreground">Total Size</p>
          </div>
        </div>

        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Files are automatically split into chunks for optimal retrieval
          </p>
          {stats.totalChunks < 3 && (
            <p className="text-xs text-accent mt-1">
              ⚠️ Need at least 3 chunks for search functionality
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

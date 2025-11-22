"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Trash2, Calendar, HardDrive, Download } from "lucide-react";
import { apiClient } from "@/helpers/networking";

interface KnowledgeFile {
  _id: string;
  filename: string;
  size: number;
  mimeType: string;
  createdAt: string;
}

interface FileListProps {
  files: KnowledgeFile[];
  onDeleteFile: (fileId: string) => void;
}

export function FileList({ files, onDeleteFile }: FileListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDelete = async (fileId: string) => {
    if (window.confirm("Are you sure you want to delete this file?")) {
      setDeletingId(fileId);
      try {
        await onDeleteFile(fileId);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleDownload = async (fileId: string, filename: string) => {
    const response = await apiClient.get(`/knowledge/download/${fileId}`, {
      responseType: "blob",
    });
    const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = blobUrl;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  };

  if (files.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No files uploaded yet</p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Upload your first text file to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {files.map((file) => (
        <Card
          key={file._id}
          className="bg-card border-border hover:border-[rgba(0,255,136,0.3)] transition-colors"
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {file.filename}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <div className="flex items-center gap-1">
                      <HardDrive className="w-3 h-3" />
                      {formatFileSize(file.size)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(file.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(file._id, file.filename)}
                  className="text-primary hover:text-accent hover:border-primary"
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(file._id)}
                  disabled={deletingId === file._id}
                  className="text-destructive hover:text-destructive/90 hover:border-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                  {deletingId === file._id ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

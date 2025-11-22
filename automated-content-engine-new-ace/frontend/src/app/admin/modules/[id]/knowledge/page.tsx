"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "@/helpers/networking";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUpload } from "@/components/FileUpload";
import { FileList } from "@/components/FileList";
import { KnowledgeStats } from "@/components/KnowledgeStats";

interface KnowledgeFile {
  _id: string;
  filename: string;
  size: number;
  mimeType: string;
  createdAt: string;
}

interface KnowledgeStats {
  fileCount: number;
  totalChunks: number;
  totalSize: number;
}

interface ModuleDetail {
  _id: string;
  name: string;
  slug: string;
  systemPrompt?: string;
  isActive: boolean;
}

export default function KnowledgeManagementPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const moduleId = id as string;

  const [moduleData, setModuleData] = useState<ModuleDetail | null>(null);
  const [files, setFiles] = useState<KnowledgeFile[]>([]);
  const [stats, setStats] = useState<KnowledgeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);

      // First, get the module data to get the slug
      const moduleRes = await apiClient.get(`/modules/${moduleId}`);
      setModuleData(moduleRes.data);

      // Then use the slug to fetch knowledge base data
      const [filesRes, statsRes] = await Promise.all([
        apiClient.get(`/knowledge/files/${moduleRes.data.slug}`),
        apiClient.get(`/knowledge/stats/${moduleRes.data.slug}`),
      ]);

      setFiles(filesRes.data);
      setStats(statsRes.data);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (moduleId) {
      loadData();
    }
  }, [moduleId]);

  const handleFileUpload = async (files: File[]) => {
    if (!moduleData?.slug) {
      setError("Module data not loaded yet. Please try again.");
      return;
    }

    try {
      // Upload files sequentially to avoid overwhelming the server
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("moduleSlug", moduleData.slug);

        await apiClient.post("/knowledge/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      // Reload data after all uploads complete
      await loadData();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to upload files");
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      await apiClient.delete(`/knowledge/files/${fileId}`);
      // Reload data
      await loadData();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to delete file");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!moduleData) return null;

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">
            Knowledge Base: {moduleData.name}
          </h1>
          <p className="text-gray-400">
            Upload text files to enhance this module's knowledge base
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push(`/admin/modules/${moduleId}`)}
        >
          Back to Module
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-900/20 border border-red-500/50 rounded text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stats */}
        <div className="lg:col-span-1">
          <KnowledgeStats stats={stats} />
        </div>

        {/* Upload */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Upload Knowledge Files</CardTitle>
            </CardHeader>
            <CardContent>
              <FileUpload
                onFileUpload={handleFileUpload}
                disabled={loading || !moduleData?.slug}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* File List */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Files</CardTitle>
          </CardHeader>
          <CardContent>
            <FileList files={files} onDeleteFile={handleDeleteFile} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

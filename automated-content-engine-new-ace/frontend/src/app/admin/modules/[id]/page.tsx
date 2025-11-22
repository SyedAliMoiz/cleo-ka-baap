"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiClient } from "@/helpers/networking";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Database } from "lucide-react";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  systemPrompt: z.string().optional(),
  isActive: z.boolean(),
  isRecommended: z.boolean(),
  description: z.string().optional(),
  coverImage: z.url("Must be a valid URL"),
  emptyStateText: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
});

type FormValues = z.infer<typeof schema>;

interface ModuleDetail {
  _id: string;
  name: string;
  slug: string;
  systemPrompt?: string;
  isActive: boolean;
  isRecommended: boolean;
  description?: string;
  coverImage?: string;
  emptyStateText?: string;
  temperature?: number;
}

export default function EditModulePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const moduleId = id as string;

  const [moduleData, setModuleData] = useState<ModuleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      systemPrompt: "",
      isActive: true,
      isRecommended: false,
      description: "",
      coverImage: "",
      emptyStateText: "",
      temperature: 0.7,
    },
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get(`/modules/${moduleId}`);
        setModuleData(res.data);
        reset({
          name: res.data.name || "",
          systemPrompt: res.data.systemPrompt || "",
          isActive: res.data.isActive,
          isRecommended: res.data.isRecommended || false,
          description: res.data.description || "",
          coverImage: res.data.coverImage || "",
          emptyStateText: res.data.emptyStateText || "",
          temperature: res.data.temperature ?? 0.7,
        });
      } catch (e: any) {
        setError(e?.response?.data?.message || "Failed to load module");
      } finally {
        setLoading(false);
      }
    };
    if (moduleId) load();
  }, [moduleId, reset]);

  const onSubmit = async (values: FormValues) => {
    await apiClient.patch(`/modules/${moduleId}`, values);
    router.push("/admin/modules");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!moduleData) return null;

  return (
    <div className="px-6 sm:px-8 lg:px-12 xl:px-16 py-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">
          Edit Module: {moduleData.name}
        </h1>
        <Button variant="outline" onClick={() => router.push("/admin/modules")}>
          Back to Modules
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Knowledge Base Card */}
        <div className="lg:col-span-1">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                Knowledge Base
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Upload text files to enhance this module's knowledge base with
                RAG (Retrieval Augmented Generation).
              </p>
              <Button
                onClick={() =>
                  router.push(`/admin/modules/${moduleId}/knowledge`)
                }
                className="w-full"
                variant="outline"
              >
                <FileText className="w-4 h-4 mr-2" />
                Manage Knowledge Base
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Module Settings */}
        <div className="lg:col-span-2">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Module Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="name">Module Name</Label>
                  <input
                    id="name"
                    className="w-full bg-input border border-border rounded px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="Module name"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="description">Tool Subtitle</Label>
                  <input
                    id="description"
                    className="w-full bg-input border border-border rounded px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="One sentence: What it accomplishes"
                    {...register("description")}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="coverImage">Cover Image URL</Label>
                  <input
                    id="coverImage"
                    className="w-full bg-input border border-border rounded px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="One sentence: What it accomplishes"
                    {...register("coverImage")}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="systemPrompt">System Prompt</Label>
                  <textarea
                    id="systemPrompt"
                    className="w-full min-h-64 bg-input border border-border rounded px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="Enter system prompt..."
                    {...register("systemPrompt")}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="isActive"
                    type="checkbox"
                    {...register("isActive")}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="isRecommended"
                    type="checkbox"
                    {...register("isRecommended")}
                  />
                  <Label htmlFor="isRecommended">
                    Recommended (Start here badge)
                  </Label>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="emptyStateText">
                    Empty State Text (shown when no messages)
                  </Label>
                  <textarea
                    id="emptyStateText"
                    className="w-full min-h-24 bg-input border border-border rounded px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="Start a conversation"
                    {...register("emptyStateText")}
                  />
                  <p className="text-xs text-muted-foreground">
                    Custom text shown when users first open this module. Leave
                    empty for default message.
                  </p>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="temperature">Temperature (0-2)</Label>
                  <input
                    id="temperature"
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    className="w-full bg-input border border-border rounded px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="0.7"
                    {...register("temperature", {
                      valueAsNumber: true,
                    })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Controls randomness in AI responses. Lower (0-0.5) = more
                    focused, Higher (1-2) = more creative. Default: 0.7
                  </p>
                </div>
                {error && (
                  <div className="text-destructive text-sm">{error}</div>
                )}
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

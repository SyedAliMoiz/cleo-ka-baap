"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiClient } from "@/helpers/networking";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  tier: z.enum(["MVP", "Pro+"]),
  coverImage: z.string().url("Must be a valid URL"),
  systemPrompt: z.string().optional(),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

// Function to generate slug from name
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .trim();
};

export default function CreateModulePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      tier: "MVP",
      coverImage: "",
      systemPrompt: "",
      isActive: true,
    },
  });

  const watchedName = watch("name");
  const generatedSlug = generateSlug(watchedName || "");

  const onSubmit = async (values: FormValues) => {
    try {
      setError(null);

      const moduleData = {
        ...values,
        slug: generatedSlug,
      };

      await apiClient.post("/modules", moduleData);
      router.push("/admin/modules");
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to create module");
    }
  };

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Create New Module</h1>
        <Button variant="outline" onClick={() => router.push("/admin/modules")}>
          Back to Modules
        </Button>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Module Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <input
                id="name"
                type="text"
                className="w-full bg-input border border-border rounded px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="Enter module name..."
                {...register("name")}
              />
              {errors.name && (
                <div className="text-destructive text-sm">
                  {errors.name.message}
                </div>
              )}
            </div>

            {/* Generated Slug Preview */}
            {generatedSlug && (
              <div className="space-y-2">
                <Label>Generated Slug</Label>
                <div className="w-full bg-muted border border-border rounded px-3 py-2 text-muted-foreground">
                  {generatedSlug}
                </div>
              </div>
            )}

            {/* Tier */}
            <div className="space-y-2">
              <Label htmlFor="tier">Tier *</Label>
              <select
                id="tier"
                className="w-full bg-input border border-border rounded px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                {...register("tier")}
              >
                <option value="MVP">MVP</option>
                <option value="Pro+">Pro+</option>
              </select>
              {errors.tier && (
                <div className="text-destructive text-sm">
                  {errors.tier.message}
                </div>
              )}
            </div>

            {/* Cover Image */}
            <div className="space-y-2">
              <Label htmlFor="coverImage">Cover Image URL *</Label>
              <input
                id="coverImage"
                type="url"
                className="w-full bg-input border border-border rounded px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="https://example.com/image.png"
                {...register("coverImage")}
              />
              {errors.coverImage && (
                <div className="text-destructive text-sm">
                  {errors.coverImage.message}
                </div>
              )}
            </div>

            {/* System Prompt */}
            <div className="space-y-2">
              <Label htmlFor="systemPrompt">System Prompt</Label>
              <textarea
                id="systemPrompt"
                className="w-full min-h-32 bg-input border border-border rounded px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="Enter system prompt for this module..."
                {...register("systemPrompt")}
              />
            </div>

            {/* Active Status */}
            <div className="flex items-center gap-2">
              <input id="isActive" type="checkbox" {...register("isActive")} />
              <Label htmlFor="isActive">Active</Label>
            </div>

            {error && <div className="text-destructive text-sm">{error}</div>}

            <div className="flex gap-3">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Module"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/modules")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

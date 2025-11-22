"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiClient } from "@/helpers/networking";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const schema = z.object({
  email: z.string().email(),
  isAdmin: z.boolean(),
  tier: z.string(),
  password: z.string().min(6).optional(),
});

type FormValues = z.infer<typeof schema>;

export default function EditUserPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const userId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", isAdmin: false, tier: "basic" },
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get(`/users/${userId}`);
        const u = res.data;
        reset({ email: u.email, isAdmin: u.isAdmin, tier: u.tier });
      } catch (e: any) {
        setError(e?.response?.data?.message || "Failed to load user");
      } finally {
        setLoading(false);
      }
    };
    if (userId) load();
  }, [userId, reset]);

  const onSubmit = async (values: FormValues) => {
    await apiClient.patch(`/users/${userId}`, {
      email: values.email,
      isAdmin: values.isAdmin,
      tier: values.tier,
      ...(values.password ? { password: values.password } : {}),
    });
    router.push("/admin/users");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-lg">
      <h1 className="text-xl font-semibold mb-4">Edit User</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <div className="text-destructive text-sm">
              {errors.email.message}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input id="isAdmin" type="checkbox" {...register("isAdmin")} />
          <Label htmlFor="isAdmin">Is Admin</Label>
        </div>
        <div className="space-y-1">
          <Label htmlFor="tier">Tier</Label>
          <Input id="tier" type="text" {...register("tier")} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="password">New Password (optional)</Label>
          <Input id="password" type="password" {...register("password")} />
          {errors.password && (
            <div className="text-destructive text-sm">
              {errors.password.message}
            </div>
          )}
        </div>
        {error && <div className="text-destructive text-sm">{error}</div>}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </form>
    </div>
  );
}

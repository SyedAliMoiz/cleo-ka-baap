"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiClient } from "@/helpers/networking";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  isAdmin: z.boolean(),
  tier: z.string(),
});

type FormValues = z.infer<typeof schema>;

export default function NewUserPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { isAdmin: false, tier: "basic" },
  });

  const onSubmit = async (values: FormValues) => {
    await apiClient.post("/users", values);
    router.push("/admin/users");
  };

  return (
    <div className="p-6 max-w-lg">
      <h1 className="text-xl font-semibold mb-4">Add User</h1>
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
            <div className="text-red-400 text-sm">{errors.email.message}</div>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            {...register("password")}
            aria-invalid={!!errors.password}
          />
          {errors.password && (
            <div className="text-red-400 text-sm">
              {errors.password.message}
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
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Create"}
        </Button>
      </form>
    </div>
  );
}

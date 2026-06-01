"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormData } from "@/features/auth/schemas";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { login } from "@/features/auth/actions";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [rootError, setRootError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setRootError(null);
    const result = await login(data);
    
    if (result.error) {
      setRootError(result.error);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-200 to-base-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md animate-in slide-in-from-bottom-4 fade-in duration-500">
        <Card title="Welcome back" bordered className="border-primary/20">
          {rootError && (
            <div className="alert alert-error mb-4 text-sm font-medium">
              <span>{rootError}</span>
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="name@example.com"
              {...register("email")}
              error={errors.email?.message}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              {...register("password")}
              error={errors.password?.message}
            />
            
            <div className="pt-4">
              <Button type="submit" variant="primary" wide disabled={isSubmitting}>
                {isSubmitting ? "Logging in..." : "Login"}
              </Button>
            </div>
            
            <div className="text-center pt-2 text-sm text-base-content/70">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-primary font-medium hover:underline transition-all">
                Sign up
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

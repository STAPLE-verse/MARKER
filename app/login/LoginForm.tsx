"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormData } from "@/features/auth/schemas";
import { Card, CardBody, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { login } from "@/features/auth/actions";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface LoginFormProps {
  /** Sanitized same-origin redirect target (see utils/redirect.ts), or null for the default post-login landing page. */
  next: string | null;
}

export default function LoginForm({ next }: LoginFormProps) {
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
      router.push(next ?? "/dashboard");
      router.refresh();
    }
  };

  const signupHref = next ? `/signup?next=${encodeURIComponent(next)}` : "/signup";

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-200 to-base-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md animate-in slide-in-from-bottom-4 fade-in duration-500">
        <Card bordered className="border-primary/20">
          <CardBody>
            <CardTitle>Welcome back</CardTitle>
            <div className="text-sm text-base-content/80 bg-base-200 p-3 rounded-lg mb-4 border border-base-300">
            MARKER uses STAPLE accounts. If you already have an account on <a href="https://app.staplescience.com" target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline">STAPLE</a>, you can log in directly here.
          </div>
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
            <PasswordInput
              label="Password"
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
              <Link href={signupHref} className="text-primary font-medium hover:underline transition-all">
                Sign up
              </Link>
            </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

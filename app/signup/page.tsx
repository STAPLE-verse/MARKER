"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, type SignupFormData } from "@/features/auth/schemas";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { signUp } from "@/features/auth/actions";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignupPage() {
  const router = useRouter();
  const [rootError, setRootError] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    setRootError(null);
    const result = await signUp(data);
    
    if (result.error) {
      setRootError(result.error);
    } else {
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-200 to-base-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg animate-in slide-in-from-bottom-4 fade-in duration-500">
        <Card title="Create your account" bordered className="border-secondary/20">
          {rootError && (
            <div className="alert alert-error mb-4">
              <span>{rootError}</span>
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <Input
              label="Username"
              type="text"
              placeholder="cooldev99"
              {...register("username")}
              error={errors.username?.message}
            />
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
            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              {...register("confirmPassword")}
              error={errors.confirmPassword?.message}
            />
            
            <div className="pt-4">
              <Button type="submit" variant="secondary" wide disabled={isSubmitting}>
                {isSubmitting ? "Creating account..." : "Sign Up"}
              </Button>
            </div>
            
            <div className="text-center pt-2 text-sm text-base-content/70">
              Already have an account?{" "}
              <Link href="/login" className="text-secondary font-medium hover:underline transition-all">
                Log in
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

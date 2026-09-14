"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, type SignupFormData } from "@/features/auth/schemas";
import { Card, CardBody, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { signUp } from "@/features/auth/actions";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface SignupFormProps {
  /** Sanitized same-origin redirect target (see utils/redirect.ts), threaded through to /login after signup. */
  next: string | null;
}

export default function SignupForm({ next }: SignupFormProps) {
  const router = useRouter();
  const [rootError, setRootError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : "/login";

  const onSubmit = async (data: SignupFormData) => {
    setRootError(null);
    const result = await signUp(data);

    if (result.error) {
      setRootError(result.error);
    } else {
      router.push(loginHref);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-200 to-base-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg animate-in slide-in-from-bottom-4 fade-in duration-500">
        <Card bordered className="border-secondary/20">
          <CardBody>
            <CardTitle>Create your account</CardTitle>
            <div className="text-sm text-base-content/80 bg-base-200 p-3 rounded-lg mb-4 border border-base-300">
            Creating an account here will also create a global account for you on <a href="https://app.staplescience.com" target="_blank" rel="noopener noreferrer" className="text-secondary font-medium hover:underline">STAPLE</a>. If you already have a STAPLE account, you do not need to sign up again.
          </div>
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
            <PasswordInput
              label="Password"
              placeholder="••••••••"
              {...register("password")}
              error={errors.password?.message}
            />
            <PasswordInput
              label="Confirm Password"
              placeholder="••••••••"
              {...register("confirmPassword")}
              error={errors.confirmPassword?.message}
            />

            <div className="pt-4">
              <Button type="submit" variant="secondary" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Creating account..." : "Sign Up"}
              </Button>
            </div>

            <div className="text-center pt-2 text-sm text-base-content/70">
              Already have an account?{" "}
              <Link href={loginHref} className="text-secondary font-medium hover:underline transition-all">
                Log in
              </Link>
            </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

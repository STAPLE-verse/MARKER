"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormData } from "@/features/auth/schemas";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { STAPLE_INPUT_CLASS } from "@/components/ui/fieldStyles";
import { STAPLE_URL, STAPLE_FORGOT_PASSWORD_URL, stapleSignupUrl } from "@/lib/staple";
import Link from "next/link";
import { login } from "@/features/auth/actions";
import { useRouter } from "next/navigation";
import { useState } from "react";

/** Fields sit on a `base-300` card here, so they take the page color as their fill. */
const FIELD_CLASS = `${STAPLE_INPUT_CLASS} bg-base-100`;

interface LoginFormProps {
  /** Sanitized same-origin redirect target (see utils/redirect.ts), or null for the default post-login landing page. */
  next: string | null;
  /** True when the visitor has just created their account on STAPLE and been sent back here to log in. */
  justRegistered?: boolean;
}

export default function LoginForm({ next, justRegistered = false }: LoginFormProps) {
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

  return (
    <main className="min-h-screen flex flex-col justify-center p-4">
      <div className="flex flex-col max-w-[626px] mx-auto w-full animate-in slide-in-from-bottom-4 fade-in duration-500">
        <Link href="/" className="flex justify-center">
          <Logo className="h-32" />
        </Link>
        <h1 className="text-3xl font-bold text-center pb-8 mt-4">
          MARKER: Metadata Archive for Research Knowledge Exchange and Reuse
        </h1>
        <Card bordered className="border-2 border-primary/50">
          <CardBody>
            <p className="text-lg text-base-content/90 mb-6">
              MARKER uses STAPLE accounts. If you already have an account on{" "}
              <a
                href={STAPLE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-medium hover:underline"
              >
                STAPLE
              </a>
              , you can log in directly here.
            </p>
            {justRegistered && !rootError && (
              <div role="status" className="alert alert-success mb-4 text-base font-medium">
                <span>Your account is ready. Log in below to get started.</span>
              </div>
            )}
            {rootError && (
              <div className="alert alert-error mb-4 text-base font-medium">
                <span>{rootError}</span>
              </div>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Email:"
                type="email"
                placeholder="Email"
                className={FIELD_CLASS}
                {...register("email")}
                error={errors.email?.message}
              />
              <PasswordInput
                label="Password:"
                placeholder="Password"
                className={FIELD_CLASS}
                {...register("password")}
                error={errors.password?.message}
              />

              <div className="flex justify-end">
                <Button type="submit" variant="primary" size="md" disabled={isSubmitting}>
                  {isSubmitting ? "Logging in..." : "Log In"}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        <div className="divider py-2"></div>
        <div className="flex flex-row justify-center gap-2">
          {/* MARKER has no password-reset flow of its own — accounts are
              STAPLE's, so the reset happens there. */}
          <div className="tooltip" data-tip="Opens STAPLE in a new tab to reset your password">
            <a
              href={STAPLE_FORGOT_PASSWORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-warning btn-md text-base"
            >
              Forgot Password
            </a>
          </div>
          <div className="tooltip" data-tip="Takes you to STAPLE to create your account, then back here">
            <a href={stapleSignupUrl(next)} className="btn btn-info btn-md text-base">
              Register
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}

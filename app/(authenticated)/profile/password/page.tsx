"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Alert } from "@/components/ui/Alert";
import { useRouter } from "next/navigation";
import { changePasswordSchema, type ChangePasswordFormData } from "@/features/users/schemas";
import { useChangePassword } from "@/features/users/hooks/useChangePassword";

export default function ChangePasswordPage() {
  const router = useRouter();

  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  const { save, isSaving, formError } = useChangePassword(form);

  return (
    <div className="container mx-auto px-4 py-8 max-w-xl animate-in fade-in duration-300">
      <PageHeader
        title="Change Password"
        description="Secure your account by updating your password credentials."
      />

      <Card bordered>
        <CardBody>
          <CardTitle className="text-xl mb-4">Credentials Update</CardTitle>

          {formError && (
            <Alert variant="error" className="mb-4">
              {formError}
            </Alert>
          )}

          <form className="space-y-4" onSubmit={handleSubmit(save)}>
            <PasswordInput
              label="Current Password"
              placeholder="••••••••"
              {...register("currentPassword")}
              error={errors.currentPassword?.message}
            />
            <PasswordInput
              label="New Password"
              placeholder="••••••••"
              {...register("newPassword")}
              error={errors.newPassword?.message}
            />
            <PasswordInput
              label="Confirm New Password"
              placeholder="••••••••"
              {...register("confirmPassword")}
              error={errors.confirmPassword?.message}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="ghost" type="button" onClick={() => router.push("/profile")}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={isSaving}>
                {isSaving ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

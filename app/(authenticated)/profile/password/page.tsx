"use client";

import React from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useRouter } from "next/navigation";

export default function ChangePasswordPage() {
  const router = useRouter();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Real implementation will update password using Argon2id/Prisma on the server
    router.push("/profile");
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-xl animate-in fade-in duration-300">
      <div className="mb-4">
        <Button variant="ghost" onClick={() => router.push("/profile")} size="sm">
          ← Back to Profile
        </Button>
      </div>

      <PageHeader
        title="Change Password"
        description="Secure your account by updating your password credentials."
      />

      <Card bordered>
        <CardBody>
          <CardTitle className="text-xl mb-4">Credentials Update</CardTitle>
          <form className="space-y-4" onSubmit={handleSave}>
            <Input
              label="Current Password"
              type="password"
              required
              placeholder="••••••••"
            />
            <Input
              label="New Password"
              type="password"
              required
              placeholder="••••••••"
            />
            <Input
              label="Confirm New Password"
              type="password"
              required
              placeholder="••••••••"
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="ghost" type="button" onClick={() => router.push("/profile")}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Update Password
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

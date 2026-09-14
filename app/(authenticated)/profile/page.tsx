import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: parseInt(session.user.id) },
  });

  if (!dbUser) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl animate-in fade-in duration-300">
      <PageHeader
        title="My Profile"
        description="View your account information and linked academic credentials."
      >
        <div className="flex gap-2">
          <Link href="/profile/password">
            <Button variant="primary" outline size="sm">
              Change Password
            </Button>
          </Link>
          <Link href="/profile/edit">
            <Button variant="primary" size="sm">
              Edit Profile
            </Button>
          </Link>
        </div>
      </PageHeader>

      <div className="space-y-6">
        <Card bordered>
          <CardBody>
            <CardTitle className="text-xl border-b border-base-200 pb-2 mb-4">Account Information</CardTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <span className="text-xs text-base-content/60 font-semibold block">Username</span>
                <span className="text-base font-medium">{dbUser.username || "Not set"}</span>
              </div>
              <div>
                <span className="text-xs text-base-content/60 font-semibold block">Email Address</span>
                <span className="text-base font-medium">{dbUser.email}</span>
              </div>
              <div>
                <span className="text-xs text-base-content/60 font-semibold block">First Name</span>
                <span className="text-base font-medium">{dbUser.firstName || "Not set"}</span>
              </div>
              <div>
                <span className="text-xs text-base-content/60 font-semibold block">Last Name</span>
                <span className="text-base font-medium">{dbUser.lastName || "Not set"}</span>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card bordered>
          <CardBody>
            <CardTitle className="text-xl border-b border-base-200 pb-2 mb-4">Academic Credentials</CardTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <span className="text-xs text-base-content/60 font-semibold block">ORCID iD</span>
                {dbUser.orcid ? (
                  <span className="text-base font-mono font-medium text-success">{dbUser.orcid}</span>
                ) : (
                  <span className="text-base-content/50 italic">No ORCID connected</span>
                )}
              </div>
              <div>
                <span className="text-xs text-base-content/60 font-semibold block">Institution</span>
                <span className="text-base font-medium">{dbUser.institution || "Not set"}</span>
              </div>
              <div>
                <span className="text-xs text-base-content/60 font-semibold block">Preferred Language</span>
                <span className="text-base font-medium">{dbUser.language || "en-US"}</span>
              </div>
              <div>
                <span className="text-xs text-base-content/60 font-semibold block">Theme</span>
                <span className="text-base font-medium capitalize">{dbUser.theme || "dark"}</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

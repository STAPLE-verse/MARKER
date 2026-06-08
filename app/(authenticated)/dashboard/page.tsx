import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardBody, CardTitle } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function DashboardPage() {
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

  // Sample recent activity for demonstration
  const recentActivities = [
    { id: 1, action: "Published schema", target: "Cognitive Assessment Template v1.0.0", time: "2 hours ago" },
    { id: 2, action: "Imported form from STAPLE", target: "Patient Demographics Form", time: "1 day ago" },
    { id: 3, action: "Created draft schema", target: "EEG Recording Log", time: "3 days ago" },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl animate-in fade-in duration-300">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${session.user.username || session.user.email}! Here's your workspace overview.`}
      >
        <Link href="/collection/new">
          <Button variant="primary" size="sm">
            Create Schema
          </Button>
        </Link>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Quick Actions & Status */}
        <div className="lg:col-span-2 space-y-6">
          <Card bordered>
            <CardBody>
              <CardTitle className="text-xl font-bold">Recent Activities</CardTitle>
              <div className="divide-y divide-base-300">
                {recentActivities.map((act) => (
                  <div key={act.id} className="py-4 flex justify-between items-center first:pt-0 last:pb-0">
                    <div>
                      <span className="font-semibold text-primary">{act.action}</span>
                      <span className="text-base-content/80"> - {act.target}</span>
                    </div>
                    <span className="text-xs text-base-content/50">{act.time}</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card bordered>
            <CardBody>
              <CardTitle className="text-xl font-bold">Session & Ecosystem Status</CardTitle>
              <p className="text-sm text-base-content/80 mb-4">
                You are securely logged in. Below is your decrypted JWT user information, shared directly with the STAPLE database.
              </p>
              <div className="bg-base-300 p-4 rounded-lg overflow-x-auto border border-base-200">
                <pre className="text-xs font-mono text-secondary-content">
                  {JSON.stringify(session.user, null, 2)}
                </pre>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right Column: Statistics & Highlights */}
        <div className="space-y-6">
          <Card bordered className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
            <CardBody>
              <CardTitle className="text-lg font-bold">My Stats</CardTitle>
              <div className="stats stats-vertical bg-transparent w-full">
                <div className="stat px-0">
                  <div className="stat-title text-base-content/70">Published Schemas</div>
                  <div className="stat-value text-primary text-3xl font-extrabold">2</div>
                </div>
                <div className="stat px-0">
                  <div className="stat-title text-base-content/70">Draft Templates</div>
                  <div className="stat-value text-secondary text-3xl font-extrabold">4</div>
                </div>
                <div className="stat px-0">
                  <div className="stat-title text-base-content/70">Total Downloads/Reuse</div>
                  <div className="stat-value text-accent text-3xl font-extrabold">128</div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card bordered>
            <CardBody>
              <CardTitle className="text-lg font-bold">SSO & DB Status</CardTitle>
              <p className="text-xs text-base-content/70 leading-relaxed">
                Database: <span className="text-success font-semibold">Connected (Shared)</span>
                <br />
                User Scope: <span className="font-semibold">{dbUser.role}</span>
                <br /><br />
                Your credentials correspond to your registered STAPLE account, allowing seamless resource discovery across both platforms.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

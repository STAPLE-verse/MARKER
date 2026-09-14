import Link from "next/link";
import { requirePageAuth } from "@/utils/auth";
import { Card, CardBody, CardTitle } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { getDashboardStats, getRecentActivity } from "@/features/dashboard/queries";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import { getActivityActionLabel, getActivityTargetLabel } from "@/features/dashboard/utils/activityLabel";
import { getLatestUnreadNotifications } from "@/features/notifications/queries/getLatestUnreadNotifications";
import { DashboardNotificationsCard } from "@/features/notifications/components/DashboardNotificationsCard";
import { getUserProfile } from "@/features/users/queries/getUserProfile";
import { collectionTabHref } from "../collection/collectionTabs";

export default async function DashboardPage() {
  const { session, userId } = await requirePageAuth();

  const [stats, activity, notifications, profile] = await Promise.all([
    getDashboardStats(userId),
    getRecentActivity(userId),
    getLatestUnreadNotifications(userId),
    getUserProfile(userId),
  ]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl animate-in fade-in duration-300">
      <PageHeader
        title="Dashboard"
        // `profile` is a fresh DB read; `session.user` is JWT-cached at
        // sign-in, so it would show a stale username/email right after an
        // edit until the next login.
        description={`Welcome back, ${profile?.username || profile?.email || session.user.username || session.user.email}! Here's your workspace overview.`}
      >
        <Link href="/collection/new">
          <Button variant="primary" size="sm">
            Add schema
          </Button>
        </Link>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card bordered>
            <CardBody>
              <CardTitle className="text-xl font-bold">Recent Activities</CardTitle>
              {activity.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-base-content/70 mb-4">
                    Nothing here yet — create your first schema to get started.
                  </p>
                  <Link href="/collection/new">
                    <Button variant="primary" size="sm">
                      Add schema
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-base-300">
                  {activity.map((item, index) => (
                    <Link
                      key={index}
                      href={item.href}
                      className="py-4 flex justify-between items-center first:pt-0 last:pb-0 hover:bg-base-200/50 -mx-2 px-2 rounded transition-colors"
                    >
                      <div>
                        <span className="font-semibold text-primary">{getActivityActionLabel(item)}</span>
                        <span className="text-base-content/80"> - {getActivityTargetLabel(item)}</span>
                      </div>
                      <span className="text-xs text-base-content/50 shrink-0 ml-4">
                        {formatRelativeTime(item.timestamp)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          <Card bordered>
            <CardBody>
              <CardTitle className="text-xl font-bold">Notifications</CardTitle>
              <DashboardNotificationsCard notifications={notifications} />
              <div className="text-right mt-2">
                <Link href="/notifications" className="text-sm font-medium text-primary hover:underline">
                  View all notifications
                </Link>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card bordered className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
            <CardBody>
              <CardTitle className="text-lg font-bold">My Stats</CardTitle>
              <div className="stats stats-vertical bg-transparent w-full">
                <Link href="/collection" className="stat px-0 hover:opacity-80 transition-opacity">
                  <div className="stat-title text-base-content/70">Published Schemas</div>
                  <div className="stat-value text-primary text-3xl font-extrabold">{stats.publishedCount}</div>
                </Link>
                <Link href="/collection" className="stat px-0 hover:opacity-80 transition-opacity">
                  <div className="stat-title text-base-content/70">Draft Templates</div>
                  <div className="stat-value text-secondary text-3xl font-extrabold">{stats.draftCount}</div>
                </Link>
                <Link
                  href={collectionTabHref("archived")}
                  className="stat px-0 hover:opacity-80 transition-opacity"
                >
                  <div className="stat-title text-base-content/70">Archived</div>
                  <div className="stat-value text-accent text-3xl font-extrabold">{stats.archivedCount}</div>
                </Link>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

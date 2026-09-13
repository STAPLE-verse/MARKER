import { requirePageAuth } from "@/utils/auth";
import { getNotifications } from "@/features/notifications/queries/getNotifications";
import NotificationsClient from "./NotificationsClient";

export default async function NotificationsPage() {
  const { userId } = await requirePageAuth();
  const notifications = await getNotifications(userId);

  return <NotificationsClient notifications={notifications} />;
}

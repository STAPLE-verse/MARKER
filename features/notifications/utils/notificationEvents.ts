const NOTIFICATIONS_CHANGED_EVENT = "marker:notifications-changed";

/**
 * The nav bell (`NotificationBell.tsx`) and the full `/notifications` table
 * (`NotificationsClient.tsx`) are siblings under different layout branches —
 * not parent/child — so a mutation on one has no natural way to reach the
 * other's local state. The bell's own poll/visibility refresh (see its own
 * comment) covers *other users'* actions; this covers the caller's own
 * actions on the same page load, which would otherwise wait up to a minute
 * to show up in the bell.
 */
export function broadcastNotificationsChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
  }
}

export function onNotificationsChanged(handler: () => void): () => void {
  window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, handler);
  return () => window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, handler);
}

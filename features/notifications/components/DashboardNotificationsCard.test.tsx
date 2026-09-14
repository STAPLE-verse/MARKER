import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DashboardNotificationsCard } from "./DashboardNotificationsCard";

const setNotificationRead = vi.fn();
const broadcastNotificationsChanged = vi.fn();

vi.mock("@/features/notifications/actions/setNotificationRead", () => ({
  setNotificationRead: (...args: unknown[]) => setNotificationRead(...args),
}));

vi.mock("@/features/notifications/utils/notificationEvents", () => ({
  broadcastNotificationsChanged: (...args: unknown[]) => broadcastNotificationsChanged(...args),
}));

function notification(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    message: "jane_doe forked your schema \"Schema\".",
    read: false,
    announcement: false,
    createdAt: new Date(),
    routeData: { path: "/collection/5" },
    ...overrides,
  };
}

describe("DashboardNotificationsCard", () => {
  beforeEach(() => {
    setNotificationRead.mockReset();
    setNotificationRead.mockResolvedValue({ ok: true, data: undefined });
    broadcastNotificationsChanged.mockReset();
  });

  it("shows the empty state when there are no unread notifications", () => {
    render(<DashboardNotificationsCard notifications={[]} />);

    expect(screen.getByText("You're all caught up.")).toBeInTheDocument();
  });

  it("marks the notification read and broadcasts the change when clicked — the bug this component fixes", async () => {
    render(<DashboardNotificationsCard notifications={[notification()]} />);

    fireEvent.click(screen.getByText('jane_doe forked your schema "Schema".'));

    await waitFor(() => {
      expect(setNotificationRead).toHaveBeenCalledWith({ notificationId: 1, read: true });
      expect(broadcastNotificationsChanged).toHaveBeenCalledTimes(1);
    });
  });

  it("optimistically removes the row from its own list once opened", async () => {
    render(<DashboardNotificationsCard notifications={[notification()]} />);

    fireEvent.click(screen.getByText('jane_doe forked your schema "Schema".'));

    await waitFor(() => {
      expect(screen.getByText("You're all caught up.")).toBeInTheDocument();
    });
  });
});

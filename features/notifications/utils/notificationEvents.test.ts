import { describe, expect, it, vi } from "vitest";
import { broadcastNotificationsChanged, onNotificationsChanged } from "./notificationEvents";

describe("notificationEvents", () => {
  it("calls every subscribed handler when a change is broadcast", () => {
    const handler = vi.fn();
    const unsubscribe = onNotificationsChanged(handler);

    broadcastNotificationsChanged();

    expect(handler).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it("stops calling a handler once unsubscribed", () => {
    const handler = vi.fn();
    const unsubscribe = onNotificationsChanged(handler);
    unsubscribe();

    broadcastNotificationsChanged();

    expect(handler).not.toHaveBeenCalled();
  });

  it("does not affect a handler subscribed by someone else after unsubscribing its own", () => {
    const handlerA = vi.fn();
    const handlerB = vi.fn();
    const unsubscribeA = onNotificationsChanged(handlerA);
    onNotificationsChanged(handlerB);
    unsubscribeA();

    broadcastNotificationsChanged();

    expect(handlerA).not.toHaveBeenCalled();
    expect(handlerB).toHaveBeenCalledTimes(1);
  });
});

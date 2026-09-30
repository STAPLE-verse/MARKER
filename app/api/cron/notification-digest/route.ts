import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { sendNotificationDigest } from "@/features/notifications/digest/sendNotificationDigest";

const FREQUENCIES = { daily: "DAILY", weekly: "WEEKLY" } as const;

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  // No secret configured means the job is off, not open to anyone.
  if (!secret) return false;

  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/**
 * Sends the daily or weekly notification roundup. Meant to be called by a
 * scheduler, once a day with `?frequency=daily` and once a week with
 * `?frequency=weekly` (see docs/deployment.md):
 *
 *   curl -H "Authorization: Bearer $CRON_SECRET" \
 *     "$NEXT_PUBLIC_APP_URL/api/cron/notification-digest?frequency=daily"
 *
 * Guarded by `CRON_SECRET` because each call sends real email — unlike
 * STAPLE's `/api/send-email`, which its cron scripts post to with no check.
 */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const param = new URL(request.url).searchParams.get("frequency") ?? "";
  const frequency = FREQUENCIES[param as keyof typeof FREQUENCIES];
  if (!frequency) {
    return NextResponse.json({ error: 'frequency must be "daily" or "weekly"' }, { status: 400 });
  }

  return NextResponse.json(await sendNotificationDigest(frequency));
}

import { NextResponse } from "next/server";
import { getPortalFeed } from "@/lib/portal-feed";

export const dynamic = "force-dynamic";

export async function GET() {
  const payload = await getPortalFeed();
  console.log("feed-meta", JSON.stringify(payload.meta));
  return NextResponse.json(payload, { headers: { "Cache-Control": "no-store, max-age=0" } });
}

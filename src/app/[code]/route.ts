import { NextResponse } from "next/server";

import { classifyUserAgent, recordClick } from "@/lib/analytics";
import { findShortLinkByCode } from "@/lib/links";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const link = await findShortLinkByCode(code);

  if (!link) {
    return new NextResponse("Not found", { status: 404 });
  }

  const userAgent = request.headers.get("user-agent");
  if (!classifyUserAgent(userAgent).isBot) {
    try {
      await recordClick(link.id, userAgent);
    } catch {
      console.error("Unable to record short-link click");
    }
  }

  return NextResponse.redirect(link.destinationUrl, 302);
}

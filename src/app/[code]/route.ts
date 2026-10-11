import { NextResponse } from "next/server";
import { recordClick } from "@/lib/links-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const link = recordClick(code);

  if (!link) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(null, {
    status: 302,
    headers: { location: link.destinationUrl },
  });
}

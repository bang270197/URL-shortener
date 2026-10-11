import { NextResponse } from "next/server";
import { createLink } from "@/lib/links-store";
const codePattern = /^[a-z0-9-]{3,50}$/;

export async function POST(request: Request) {
  try {
    const body = await request.json() as { destinationUrl?: string; code?: string };
    const code = body.code?.trim().toLowerCase() ?? "";
    const destinationUrl = new URL(body.destinationUrl ?? "");
    if (!codePattern.test(code) || !["http:", "https:"].includes(destinationUrl.protocol)) {
      return NextResponse.json({ error: "Enter a valid HTTP(S) URL and a code using 3–50 letters, numbers, or hyphens." }, { status: 400 });
    }
    if (!createLink(code, destinationUrl.toString())) return NextResponse.json({ error: "This custom code is already in use." }, { status: 409 });
    return NextResponse.json({ code, destinationUrl: destinationUrl.toString(), shortUrl: new URL(`/${code}`, request.url).toString() }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Enter a valid HTTP(S) URL and custom code." }, { status: 400 });
  }
}

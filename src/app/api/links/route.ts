import { NextResponse } from "next/server";

import { createShortLink, DuplicateCodeError } from "@/lib/links";
import { parseCreateLinkInput } from "@/lib/validation";

function getAppUrl(request: Request): URL {
  return new URL(process.env.NEXT_PUBLIC_APP_URL ?? request.url);
}

export async function POST(request: Request) {
  try {
    const input = parseCreateLinkInput(await request.json());
    const shortLink = await createShortLink(input);
    const shortUrl = new URL(`/${shortLink.code}`, getAppUrl(request)).toString();

    return NextResponse.json(
      {
        code: shortLink.code,
        destinationUrl: shortLink.destinationUrl,
        shortUrl,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof DuplicateCodeError) {
      return NextResponse.json({ error: "This custom code is already in use." }, { status: 409 });
    }

    if (error instanceof SyntaxError || error instanceof Error && error.name === "CreateLinkInputError") {
      return NextResponse.json(
        { error: "Enter a valid HTTP(S) URL and custom code." },
        { status: 400 },
      );
    }

    console.error("Unable to create short link");
    return NextResponse.json({ error: "Unable to create the short link." }, { status: 500 });
  }
}

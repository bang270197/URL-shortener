const CODE_PATTERN = /^[a-z0-9-]{3,50}$/;
const RESERVED_CODES = new Set(["api", "stats", "favicon.ico"]);

export class CreateLinkInputError extends Error {
  constructor() {
    super("Invalid short link input");
    this.name = "CreateLinkInputError";
  }
}

export type CreateLinkInput = {
  code: string;
  destinationUrl: string;
};

export function normalizeCode(code: string): string {
  return code.trim().toLowerCase();
}

export function parseCreateLinkInput(input: unknown): CreateLinkInput {
  if (!input || typeof input !== "object") {
    throw new CreateLinkInputError();
  }

  const { code, destinationUrl } = input as Record<string, unknown>;
  if (typeof code !== "string" || typeof destinationUrl !== "string") {
    throw new CreateLinkInputError();
  }

  const normalizedCode = normalizeCode(code);
  if (!CODE_PATTERN.test(normalizedCode) || RESERVED_CODES.has(normalizedCode)) {
    throw new CreateLinkInputError();
  }

  try {
    const parsedUrl = new URL(destinationUrl);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      throw new CreateLinkInputError();
    }

    return { code: normalizedCode, destinationUrl: parsedUrl.toString() };
  } catch (error) {
    if (error instanceof CreateLinkInputError) {
      throw error;
    }

    throw new CreateLinkInputError();
  }
}

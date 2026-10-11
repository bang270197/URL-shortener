import type { ShortLink } from "@prisma/client";

import { prisma } from "./db";
import { normalizeCode, type CreateLinkInput } from "./validation";

export class DuplicateCodeError extends Error {
  constructor() {
    super("That custom code is already in use");
    this.name = "DuplicateCodeError";
  }
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

export async function createShortLink(input: CreateLinkInput): Promise<ShortLink> {
  try {
    return await prisma.shortLink.create({
      data: {
        code: normalizeCode(input.code),
        destinationUrl: input.destinationUrl,
      },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new DuplicateCodeError();
    }

    throw error;
  }
}

export function findShortLinkByCode(code: string): Promise<ShortLink | null> {
  return prisma.shortLink.findUnique({ where: { code: normalizeCode(code) } });
}

export function listRecentShortLinks(): Promise<ShortLink[]> {
  return prisma.shortLink.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });
}

export type LinkRecord = {
  destinationUrl: string;
  clickCount: number;
};

declare global {
  // eslint-disable-next-line no-var
  var __shortlyLinks: Map<string, LinkRecord> | undefined;
}

const links = globalThis.__shortlyLinks ?? new Map<string, LinkRecord>();
globalThis.__shortlyLinks = links;

function normalizeCode(code: string) {
  return code.trim().toLowerCase();
}

export function createLink(code: string, destinationUrl: string) {
  const normalizedCode = normalizeCode(code);

  if (links.has(normalizedCode)) {
    return false;
  }

  links.set(normalizedCode, { destinationUrl, clickCount: 0 });
  return true;
}

export function getLink(code: string) {
  return links.get(normalizeCode(code));
}

export function recordClick(code: string) {
  const link = getLink(code);

  if (!link) {
    return null;
  }

  link.clickCount += 1;
  return link;
}

export function resetLinks() {
  links.clear();
}

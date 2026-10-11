import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const schemaPath = path.resolve(process.cwd(), "prisma/schema.prisma");

test("defines persistent short-link and click-event models", () => {
  expect(existsSync(schemaPath)).toBe(true);

  if (!existsSync(schemaPath)) {
    return;
  }

  const schema = readFileSync(schemaPath, "utf8");

  expect(schema).toContain("model ShortLink");
  expect(schema).toContain("code           String       @unique");
  expect(schema).toContain("model ClickEvent");
  expect(schema).toContain("@@index([shortLinkId])");
  expect(schema).toContain("@@index([clickedAt])");
  expect(schema).toContain("@@index([shortLinkId, clickedAt])");
});

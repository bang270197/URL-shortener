-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('desktop', 'mobile', 'tablet', 'other');

-- CreateTable
CREATE TABLE "ShortLink" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "destinationUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShortLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClickEvent" (
    "id" TEXT NOT NULL,
    "shortLinkId" TEXT NOT NULL,
    "clickedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deviceType" "DeviceType" NOT NULL,
    "browser" TEXT NOT NULL,

    CONSTRAINT "ClickEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShortLink_code_key" ON "ShortLink"("code");

-- CreateIndex
CREATE INDEX "ClickEvent_shortLinkId_idx" ON "ClickEvent"("shortLinkId");

-- CreateIndex
CREATE INDEX "ClickEvent_clickedAt_idx" ON "ClickEvent"("clickedAt");

-- CreateIndex
CREATE INDEX "ClickEvent_shortLinkId_clickedAt_idx" ON "ClickEvent"("shortLinkId", "clickedAt");

-- AddForeignKey
ALTER TABLE "ClickEvent" ADD CONSTRAINT "ClickEvent_shortLinkId_fkey" FOREIGN KEY ("shortLinkId") REFERENCES "ShortLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

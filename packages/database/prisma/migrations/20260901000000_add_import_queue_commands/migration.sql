CREATE TYPE "ImportQueueCommandName" AS ENUM (
    'DISCOVER_STORY',
    'PREPARE_CATALOG',
    'IMPORT_CHAPTER'
);

CREATE TYPE "ImportQueueCommandStatus" AS ENUM (
    'PENDING',
    'PUBLISHING',
    'PUBLISHED'
);

CREATE TABLE "StoryImportQueueCommand" (
    "id" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "name" "ImportQueueCommandName" NOT NULL,
    "importJobId" TEXT NOT NULL,
    "chapterDraftId" TEXT,
    "status" "ImportQueueCommandStatus" NOT NULL DEFAULT 'PENDING',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leaseExpiresAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StoryImportQueueCommand_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StoryImportQueueCommand_dedupeKey_key"
ON "StoryImportQueueCommand"("dedupeKey");
CREATE INDEX "StoryImportQueueCommand_status_availableAt_idx"
ON "StoryImportQueueCommand"("status", "availableAt");
CREATE INDEX "StoryImportQueueCommand_status_leaseExpiresAt_idx"
ON "StoryImportQueueCommand"("status", "leaseExpiresAt");
CREATE INDEX "StoryImportQueueCommand_importJobId_idx"
ON "StoryImportQueueCommand"("importJobId");

ALTER TABLE "StoryImportQueueCommand"
ADD CONSTRAINT "StoryImportQueueCommand_importJobId_fkey"
FOREIGN KEY ("importJobId") REFERENCES "StoryImportJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StoryImportQueueCommand"
ADD CONSTRAINT "StoryImportQueueCommand_chapterDraftId_fkey"
FOREIGN KEY ("chapterDraftId") REFERENCES "ChapterImportDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;

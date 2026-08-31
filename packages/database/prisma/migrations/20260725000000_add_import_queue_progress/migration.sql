CREATE TYPE "ImportJobStage" AS ENUM ('DISCOVERY', 'CHAPTER_IMPORT', 'REVIEW');
CREATE TYPE "ChapterImportStatus" AS ENUM ('PENDING', 'QUEUED', 'RUNNING', 'COMPLETED', 'FAILED');
CREATE TYPE "SourceFetchTransport" AS ENUM ('DIRECT', 'CHROMIUM');

ALTER TABLE "StoryImportJob"
ADD COLUMN "requestedSourceUrl" TEXT,
ADD COLUMN "stage" "ImportJobStage" NOT NULL DEFAULT 'DISCOVERY',
ADD COLUMN "queuedChapterCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "completedChapterCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "failedChapterCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "discoveredAt" TIMESTAMP(3);

UPDATE "StoryImportJob"
SET
    "stage" = 'REVIEW',
    "discoveredAt" = COALESCE("completedAt", "updatedAt"),
    "completedAt" = NULL
WHERE "status" = 'REVIEW_REQUIRED';

ALTER TABLE "ChapterImportDraft"
ADD COLUMN "importStatus" "ChapterImportStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "attemptCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "errorCode" TEXT,
ADD COLUMN "errorMessage" TEXT,
ADD COLUMN "fetchTransport" "SourceFetchTransport",
ADD COLUMN "fetchedAt" TIMESTAMP(3);

CREATE INDEX "ChapterImportDraft_draftId_importStatus_number_idx"
ON "ChapterImportDraft"("draftId", "importStatus", "number");

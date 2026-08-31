CREATE TYPE "ImportProvider" AS ENUM ('TRUYENDICH_LIVE');
CREATE TYPE "ImportMode" AS ENUM ('ALL', 'MISSING', 'RANGE');
CREATE TYPE "ImportJobStatus" AS ENUM (
    'DRAFT',
    'DISCOVERING',
    'QUEUED',
    'RUNNING',
    'PAUSED',
    'REVIEW_REQUIRED',
    'COMPLETED',
    'PARTIAL_FAILED',
    'FAILED',
    'CANCELLED'
);

CREATE TABLE "StoryImportSource" (
    "id" TEXT NOT NULL,
    "provider" "ImportProvider" NOT NULL,
    "externalNovelId" TEXT NOT NULL,
    "sourceSlug" TEXT NOT NULL,
    "canonicalUrl" TEXT NOT NULL,
    "lastDiscoveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StoryImportSource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StoryImportJob" (
    "id" TEXT NOT NULL,
    "clientRequestId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "sourceId" TEXT,
    "targetStoryId" INTEGER,
    "selectedEditionExternalId" TEXT,
    "selectedEditionName" TEXT,
    "mode" "ImportMode" NOT NULL DEFAULT 'MISSING',
    "rangeStart" INTEGER,
    "rangeEnd" INTEGER,
    "requestedConcurrency" INTEGER NOT NULL DEFAULT 1,
    "status" "ImportJobStatus" NOT NULL DEFAULT 'DRAFT',
    "discoveredChapterCount" INTEGER NOT NULL DEFAULT 0,
    "sourceChapterCount" INTEGER,
    "warningMessages" JSONB,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StoryImportJob_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StoryImportDraft" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "coverUrl" TEXT,
    "description" TEXT NOT NULL,
    "sourceStatus" TEXT,
    "categories" JSONB NOT NULL,
    "availableEditions" JSONB NOT NULL,
    "rawMetadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StoryImportDraft_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChapterImportDraft" (
    "id" TEXT NOT NULL,
    "draftId" TEXT NOT NULL,
    "externalChapterId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "sourceStatus" TEXT,
    "sourceUpdatedAt" TIMESTAMP(3),
    "sourceUrl" TEXT,
    "content" TEXT,
    "contentHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ChapterImportDraft_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StoryImportSource_provider_externalNovelId_key"
ON "StoryImportSource"("provider", "externalNovelId");
CREATE UNIQUE INDEX "StoryImportSource_provider_sourceSlug_key"
ON "StoryImportSource"("provider", "sourceSlug");
CREATE UNIQUE INDEX "StoryImportJob_clientRequestId_key"
ON "StoryImportJob"("clientRequestId");
CREATE INDEX "StoryImportJob_ownerId_status_updatedAt_idx"
ON "StoryImportJob"("ownerId", "status", "updatedAt");
CREATE INDEX "StoryImportJob_sourceId_idx" ON "StoryImportJob"("sourceId");
CREATE INDEX "StoryImportJob_targetStoryId_idx" ON "StoryImportJob"("targetStoryId");
CREATE UNIQUE INDEX "StoryImportDraft_jobId_key" ON "StoryImportDraft"("jobId");
CREATE UNIQUE INDEX "ChapterImportDraft_draftId_externalChapterId_key"
ON "ChapterImportDraft"("draftId", "externalChapterId");
CREATE INDEX "ChapterImportDraft_draftId_number_idx"
ON "ChapterImportDraft"("draftId", "number");

ALTER TABLE "StoryImportJob"
ADD CONSTRAINT "StoryImportJob_ownerId_fkey"
FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StoryImportJob"
ADD CONSTRAINT "StoryImportJob_sourceId_fkey"
FOREIGN KEY ("sourceId") REFERENCES "StoryImportSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StoryImportJob"
ADD CONSTRAINT "StoryImportJob_targetStoryId_fkey"
FOREIGN KEY ("targetStoryId") REFERENCES "Story"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StoryImportDraft"
ADD CONSTRAINT "StoryImportDraft_jobId_fkey"
FOREIGN KEY ("jobId") REFERENCES "StoryImportJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChapterImportDraft"
ADD CONSTRAINT "ChapterImportDraft_draftId_fkey"
FOREIGN KEY ("draftId") REFERENCES "StoryImportDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;

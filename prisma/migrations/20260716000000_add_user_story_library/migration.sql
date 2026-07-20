-- Preserve chapter-level history while adding one current reading state per user/story.
ALTER TABLE "UserSetting" ADD COLUMN "notifyGeneral" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Story" ADD COLUMN "latestChapterAt" TIMESTAMP(3);

UPDATE "UserSetting" SET "notifyGeneral" = "notifyInteraction";

CREATE TYPE "NotificationType" AS ENUM ('NEW_CHAPTER', 'INTERACTION', 'SYSTEM');

CREATE TABLE "UserStoryReadingState" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "storyId" INTEGER NOT NULL,
    "lastChapterId" INTEGER NOT NULL,
    "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hiddenAt" TIMESTAMP(3),
    CONSTRAINT "UserStoryReadingState_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StorySubscription" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "storyId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StorySubscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "storyId" INTEGER,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "dedupeKey" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserStoryReadingState_userId_storyId_key" ON "UserStoryReadingState"("userId", "storyId");
CREATE INDEX "Story_latestChapterAt_idx" ON "Story"("latestChapterAt");
CREATE INDEX "UserStoryReadingState_userId_hiddenAt_lastReadAt_idx" ON "UserStoryReadingState"("userId", "hiddenAt", "lastReadAt");
CREATE INDEX "UserStoryReadingState_storyId_idx" ON "UserStoryReadingState"("storyId");
CREATE UNIQUE INDEX "StorySubscription_userId_storyId_key" ON "StorySubscription"("userId", "storyId");
CREATE INDEX "StoryBookmark_userId_createdAt_idx" ON "StoryBookmark"("userId", "createdAt");
CREATE INDEX "StorySubscription_storyId_idx" ON "StorySubscription"("storyId");
CREATE UNIQUE INDEX "Notification_dedupeKey_key" ON "Notification"("dedupeKey");
CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");
CREATE INDEX "Notification_storyId_createdAt_idx" ON "Notification"("storyId", "createdAt");

ALTER TABLE "UserStoryReadingState" ADD CONSTRAINT "UserStoryReadingState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserStoryReadingState" ADD CONSTRAINT "UserStoryReadingState_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserStoryReadingState" ADD CONSTRAINT "UserStoryReadingState_lastChapterId_fkey" FOREIGN KEY ("lastChapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StorySubscription" ADD CONSTRAINT "StorySubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StorySubscription" ADD CONSTRAINT "StorySubscription_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

UPDATE "Story" s
SET "latestChapterAt" = latest."postedAt"
FROM (
    SELECT "storyId", MAX("postedAt") AS "postedAt"
    FROM "Chapter"
    GROUP BY "storyId"
) latest
WHERE latest."storyId" = s."id";

CREATE OR REPLACE FUNCTION refresh_story_latest_chapter_at()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD."storyId" <> NEW."storyId") THEN
        UPDATE "Story"
        SET "latestChapterAt" = (
            SELECT MAX("postedAt") FROM "Chapter" WHERE "storyId" = OLD."storyId"
        )
        WHERE "id" = OLD."storyId";
    END IF;

    IF TG_OP <> 'DELETE' THEN
        UPDATE "Story"
        SET "latestChapterAt" = (
            SELECT MAX("postedAt") FROM "Chapter" WHERE "storyId" = NEW."storyId"
        )
        WHERE "id" = NEW."storyId";
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "Chapter_refresh_story_latest_chapter_at"
AFTER INSERT OR UPDATE OF "postedAt", "storyId" OR DELETE ON "Chapter"
FOR EACH ROW EXECUTE FUNCTION refresh_story_latest_chapter_at();

INSERT INTO "UserStoryReadingState" ("userId", "storyId", "lastChapterId", "lastReadAt")
SELECT DISTINCT ON (cr."userId", c."storyId")
    cr."userId",
    c."storyId",
    cr."chapterId",
    cr."updatedAt"
FROM "ChapterRead" cr
JOIN "Chapter" c ON c."id" = cr."chapterId"
ORDER BY cr."userId", c."storyId", cr."updatedAt" DESC, cr."id" DESC;

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX "Story_latestChapterAt_id_idx"
ON "Story"("latestChapterAt", "id");

CREATE INDEX "Story_totalChapters_id_idx"
ON "Story"("totalChapters", "id");

CREATE INDEX "StoryStats_averageRating_storyId_idx"
ON "StoryStats"("averageRating", "storyId");

CREATE INDEX "StoryStats_totalReads_storyId_idx"
ON "StoryStats"("totalReads", "storyId");

CREATE INDEX "Story_slug_trgm_idx"
ON "Story" USING GIN ("slug" gin_trgm_ops);

CREATE INDEX "Author_slug_trgm_idx"
ON "Author" USING GIN ("slug" gin_trgm_ops);

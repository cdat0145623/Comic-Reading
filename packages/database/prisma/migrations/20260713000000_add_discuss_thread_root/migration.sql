-- Add a stable thread identifier while preserving parentId as the reply target.
ALTER TABLE "Discuss" ADD COLUMN "threadRootId" INTEGER;

-- Backfill every existing descendant with its top-level discussion id.
WITH RECURSIVE discussion_tree AS (
    SELECT "id", "id" AS "rootId"
    FROM "Discuss"
    WHERE "parentId" IS NULL

    UNION ALL

    SELECT child."id", discussion_tree."rootId"
    FROM "Discuss" AS child
    INNER JOIN discussion_tree ON child."parentId" = discussion_tree."id"
)
UPDATE "Discuss" AS discussion
SET "threadRootId" = discussion_tree."rootId"
FROM discussion_tree
WHERE discussion."id" = discussion_tree."id"
  AND discussion."parentId" IS NOT NULL;

CREATE INDEX "Discuss_storyId_parentId_createdAt_id_idx"
ON "Discuss"("storyId", "parentId", "createdAt", "id");

CREATE INDEX "Discuss_storyId_threadRootId_createdAt_id_idx"
ON "Discuss"("storyId", "threadRootId", "createdAt", "id");

ALTER TABLE "Discuss"
ADD CONSTRAINT "Discuss_threadRootId_fkey"
FOREIGN KEY ("threadRootId") REFERENCES "Discuss"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

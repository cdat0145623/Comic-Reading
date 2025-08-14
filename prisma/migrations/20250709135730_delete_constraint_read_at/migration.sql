/*
  Warnings:

  - A unique constraint covering the columns `[userId,chapterId]` on the table `ChapterRead` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "ChapterRead_userId_chapterId_readAt_key";

-- CreateIndex
CREATE UNIQUE INDEX "ChapterRead_userId_chapterId_key" ON "ChapterRead"("userId", "chapterId");

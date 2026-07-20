/*
  Warnings:

  - You are about to drop the `StoryReadStats` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "StoryReadStats" DROP CONSTRAINT "TopStoryRead_storyId_fkey";

-- DropTable
DROP TABLE "StoryReadStats";

-- CreateTable
CREATE TABLE "TopStoryRead" (
    "id" SERIAL NOT NULL,
    "storyId" INTEGER NOT NULL,
    "readerCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,

    CONSTRAINT "TopStoryRead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TopStoryRead_storyId_duration_key" ON "TopStoryRead"("storyId", "duration");

-- AddForeignKey
ALTER TABLE "TopStoryRead" ADD CONSTRAINT "TopStoryRead_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

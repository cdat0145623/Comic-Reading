/*
  Warnings:

  - You are about to drop the `TopStoryRead` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "TopStoryRead" DROP CONSTRAINT "TopStoryRead_storyId_fkey";

-- DropTable
DROP TABLE "TopStoryRead";

-- CreateTable
CREATE TABLE "StoryReadStats" (
    "id" SERIAL NOT NULL,
    "storyId" INTEGER NOT NULL,
    "readerCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "windowEnd" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoryReadStats_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "StoryReadStats" ADD CONSTRAINT "StoryReadStats_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

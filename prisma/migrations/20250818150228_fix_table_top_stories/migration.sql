/*
  Warnings:

  - A unique constraint covering the columns `[storyId,duration]` on the table `TopStoryRead` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `TopStoryRead` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "TopStoryRead_storyId_duration_createdAt_key";

-- AlterTable
ALTER TABLE "TopStoryRead" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "TopStoryRead_storyId_duration_key" ON "TopStoryRead"("storyId", "duration");

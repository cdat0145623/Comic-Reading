/*
  Warnings:

  - Added the required column `updatedAt` to the `Discuss` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `DiscussLike` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Discuss" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "DiscussLike" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "ChapterReadEvent" (
    "id" SERIAL NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "storyId" INTEGER NOT NULL,
    "chapterId" INTEGER NOT NULL,

    CONSTRAINT "ChapterReadEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChapterReadEvent_readAt_idx" ON "ChapterReadEvent"("readAt");

-- CreateIndex
CREATE INDEX "ChapterReadEvent_storyId_readAt_idx" ON "ChapterReadEvent"("storyId", "readAt");

-- CreateIndex
CREATE INDEX "ChapterReadEvent_userId_readAt_idx" ON "ChapterReadEvent"("userId", "readAt");

-- CreateIndex
CREATE INDEX "ChapterReadEvent_chapterId_readAt_idx" ON "ChapterReadEvent"("chapterId", "readAt");

-- AddForeignKey
ALTER TABLE "ChapterReadEvent" ADD CONSTRAINT "ChapterReadEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChapterReadEvent" ADD CONSTRAINT "ChapterReadEvent_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChapterReadEvent" ADD CONSTRAINT "ChapterReadEvent_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

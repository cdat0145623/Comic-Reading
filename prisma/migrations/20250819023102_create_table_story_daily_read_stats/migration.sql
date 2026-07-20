-- CreateTable
CREATE TABLE "StoryDailyReadStats" (
    "id" SERIAL NOT NULL,
    "storyId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "readerCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "StoryDailyReadStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StoryDailyReadStats_storyId_date_key" ON "StoryDailyReadStats"("storyId", "date");

-- AddForeignKey
ALTER TABLE "StoryDailyReadStats" ADD CONSTRAINT "StoryDailyReadStats_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

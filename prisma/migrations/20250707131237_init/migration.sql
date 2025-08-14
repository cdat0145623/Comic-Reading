-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('secret', 'male', 'female');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('user', 'uploader', 'admin');

-- CreateEnum
CREATE TYPE "SortReadingOption" AS ENUM ('latest_chapter', 'recently_read', 'title');

-- CreateEnum
CREATE TYPE "SortMarkedOption" AS ENUM ('latest_chapter', 'recently_saved', 'title');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "password" TEXT,
    "avatar_url" TEXT,
    "name" TEXT,
    "birthYear" INTEGER,
    "sex" "Sex",
    "role" "Role" NOT NULL DEFAULT 'user',
    "candyTotal" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "keyTotal" INTEGER NOT NULL DEFAULT 0,
    "potatoToal" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "voteTickets" INTEGER NOT NULL DEFAULT 0,
    "emailVerified" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "UserSetting" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "sortReading" "SortReadingOption" NOT NULL DEFAULT 'recently_read',
    "sortMarked" "SortMarkedOption" NOT NULL DEFAULT 'recently_saved',
    "notifyNewChapter" BOOLEAN NOT NULL DEFAULT true,
    "notifyInteraction" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "UserSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Story" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT,
    "string_url" TEXT NOT NULL,
    "totalChapters" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "uploaderId" TEXT NOT NULL,
    "authorId" INTEGER NOT NULL,
    "introduce" TEXT NOT NULL,
    "manager_pick" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Story_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoryRecommendation" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "storyId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoryRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Author" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "Author_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoryStats" (
    "storyId" INTEGER NOT NULL,
    "weeklyChapter" INTEGER NOT NULL DEFAULT 0,
    "totalReads" INTEGER NOT NULL DEFAULT 0,
    "totalVotes" INTEGER NOT NULL DEFAULT 0,
    "totalBookmarks" INTEGER NOT NULL DEFAULT 0,
    "totalComments" INTEGER NOT NULL DEFAULT 0,
    "totalFans" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoryStats_pkey" PRIMARY KEY ("storyId")
);

-- CreateTable
CREATE TABLE "Chapter" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "postedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "storyId" INTEGER NOT NULL,

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChapterRead" (
    "id" SERIAL NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "chapterId" INTEGER NOT NULL,

    CONSTRAINT "ChapterRead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopStoryRead" (
    "id" SERIAL NOT NULL,
    "storyId" INTEGER NOT NULL,
    "readerCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration" INTEGER NOT NULL,

    CONSTRAINT "TopStoryRead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TagGroup" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "TagGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" SERIAL NOT NULL,
    "label" TEXT NOT NULL,
    "groupId" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoryBookmark" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "storyId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoryBookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rating" (
    "id" SERIAL NOT NULL,
    "stars" DOUBLE PRECISION NOT NULL,
    "content" TEXT,
    "character" TEXT,
    "plot" TEXT,
    "world" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "storyId" INTEGER NOT NULL,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RatingLike" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "ratingId" INTEGER NOT NULL,

    CONSTRAINT "RatingLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RatingComment" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "ratingId" INTEGER NOT NULL,
    "parentId" INTEGER,

    CONSTRAINT "RatingComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RatingCommentLike" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "ratingCommentId" INTEGER NOT NULL,

    CONSTRAINT "RatingCommentLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Discuss" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "storyId" INTEGER NOT NULL,
    "parentId" INTEGER,

    CONSTRAINT "Discuss_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscussLike" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "discussId" INTEGER NOT NULL,

    CONSTRAINT "DiscussLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoryFan" (
    "id" SERIAL NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "storyId" INTEGER NOT NULL,

    CONSTRAINT "StoryFan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_StoryTags" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_StoryTags_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "UserSetting_userId_key" ON "UserSetting"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Story_slug_key" ON "Story"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Author_slug_key" ON "Author"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ChapterRead_userId_chapterId_readAt_key" ON "ChapterRead"("userId", "chapterId", "readAt");

-- CreateIndex
CREATE UNIQUE INDEX "TopStoryRead_storyId_duration_createdAt_key" ON "TopStoryRead"("storyId", "duration", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TagGroup_name_key" ON "TagGroup"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TagGroup_slug_key" ON "TagGroup"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "StoryBookmark_userId_storyId_key" ON "StoryBookmark"("userId", "storyId");

-- CreateIndex
CREATE UNIQUE INDEX "Rating_userId_storyId_key" ON "Rating"("userId", "storyId");

-- CreateIndex
CREATE UNIQUE INDEX "RatingLike_userId_ratingId_key" ON "RatingLike"("userId", "ratingId");

-- CreateIndex
CREATE UNIQUE INDEX "RatingCommentLike_userId_ratingCommentId_key" ON "RatingCommentLike"("userId", "ratingCommentId");

-- CreateIndex
CREATE UNIQUE INDEX "DiscussLike_userId_discussId_key" ON "DiscussLike"("userId", "discussId");

-- CreateIndex
CREATE UNIQUE INDEX "StoryFan_userId_storyId_key" ON "StoryFan"("userId", "storyId");

-- CreateIndex
CREATE INDEX "_StoryTags_B_index" ON "_StoryTags"("B");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSetting" ADD CONSTRAINT "UserSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryRecommendation" ADD CONSTRAINT "StoryRecommendation_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryRecommendation" ADD CONSTRAINT "StoryRecommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryStats" ADD CONSTRAINT "StoryStats_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChapterRead" ADD CONSTRAINT "ChapterRead_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChapterRead" ADD CONSTRAINT "ChapterRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopStoryRead" ADD CONSTRAINT "TopStoryRead_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "TagGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryBookmark" ADD CONSTRAINT "StoryBookmark_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryBookmark" ADD CONSTRAINT "StoryBookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RatingLike" ADD CONSTRAINT "RatingLike_ratingId_fkey" FOREIGN KEY ("ratingId") REFERENCES "Rating"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RatingLike" ADD CONSTRAINT "RatingLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RatingComment" ADD CONSTRAINT "RatingComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "RatingComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RatingComment" ADD CONSTRAINT "RatingComment_ratingId_fkey" FOREIGN KEY ("ratingId") REFERENCES "Rating"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RatingComment" ADD CONSTRAINT "RatingComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RatingCommentLike" ADD CONSTRAINT "RatingCommentLike_ratingCommentId_fkey" FOREIGN KEY ("ratingCommentId") REFERENCES "RatingComment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RatingCommentLike" ADD CONSTRAINT "RatingCommentLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Discuss" ADD CONSTRAINT "Discuss_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Discuss"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Discuss" ADD CONSTRAINT "Discuss_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Discuss" ADD CONSTRAINT "Discuss_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussLike" ADD CONSTRAINT "DiscussLike_discussId_fkey" FOREIGN KEY ("discussId") REFERENCES "Discuss"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussLike" ADD CONSTRAINT "DiscussLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryFan" ADD CONSTRAINT "StoryFan_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryFan" ADD CONSTRAINT "StoryFan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StoryTags" ADD CONSTRAINT "_StoryTags_A_fkey" FOREIGN KEY ("A") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StoryTags" ADD CONSTRAINT "_StoryTags_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

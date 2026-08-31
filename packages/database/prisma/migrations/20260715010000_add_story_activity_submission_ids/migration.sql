ALTER TABLE "RatingComment"
ADD COLUMN "clientSubmissionId" TEXT;

ALTER TABLE "Discuss"
ADD COLUMN "clientSubmissionId" TEXT;

CREATE UNIQUE INDEX "RatingComment_clientSubmissionId_key"
ON "RatingComment"("clientSubmissionId");

CREATE UNIQUE INDEX "Discuss_clientSubmissionId_key"
ON "Discuss"("clientSubmissionId");

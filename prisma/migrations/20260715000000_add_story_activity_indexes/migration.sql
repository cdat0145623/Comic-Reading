CREATE INDEX "Rating_storyId_createdAt_id_idx"
ON "Rating"("storyId", "createdAt", "id");

CREATE INDEX "Rating_storyId_likeCount_id_createdAt_idx"
ON "Rating"("storyId", "likeCount", "id", "createdAt");

CREATE INDEX "RatingLike_ratingId_idx"
ON "RatingLike"("ratingId");

CREATE INDEX "RatingComment_ratingId_createdAt_id_idx"
ON "RatingComment"("ratingId", "createdAt", "id");

CREATE INDEX "RatingCommentLike_ratingCommentId_idx"
ON "RatingCommentLike"("ratingCommentId");

CREATE INDEX "DiscussLike_discussId_idx"
ON "DiscussLike"("discussId");

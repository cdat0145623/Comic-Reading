-- This is an empty migration.
-- Đổi tên bảng
ALTER TABLE "TopStoryRead" RENAME TO "StoryReadStats";

-- Xoá cột duration (các index/unique phụ thuộc cột này sẽ tự rơi theo)
ALTER TABLE "StoryReadStats" DROP COLUMN "duration";

-- Thêm 2 cột mới
ALTER TABLE "StoryReadStats"
  ADD COLUMN "windowStart" TIMESTAMP(3) NOT NULL,
  ADD COLUMN "windowEnd"   TIMESTAMP(3) NOT NULL;

-- (Tuỳ chọn) Tạo unique mới theo cửa sổ thời gian
-- CREATE UNIQUE INDEX "StoryReadStats_storyId_windowStart_windowEnd_key"
--   ON "StoryReadStats"("storyId","windowStart","windowEnd");

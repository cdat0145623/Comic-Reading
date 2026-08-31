import { describe, expect, it } from "vitest";
import { getPublicActivityErrorMessage } from "@/app/_lib/story-activity-error";

describe("story activity public errors", () => {
    it("keeps short business errors", () => {
        expect(
            getPublicActivityErrorMessage(
                new Error("Bình luận cha không hợp lệ"),
                "Fallback",
            ),
        ).toBe("Bình luận cha không hợp lệ");
    });

    it("hides Prisma implementation details", () => {
        expect(
            getPublicActivityErrorMessage(
                new Error(
                    "Invalid `prisma.ratingComment.findFirst()` invocation: Unknown argument clientSubmissionId",
                ),
                "Không thể gửi bình luận. Vui lòng thử lại.",
            ),
        ).toBe("Không thể gửi bình luận. Vui lòng thử lại.");
    });
});

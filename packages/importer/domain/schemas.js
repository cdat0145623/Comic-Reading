import { z } from "zod";

export const IMPORT_MODES = ["ALL", "MISSING", "RANGE"];
export const IMPORT_CONCURRENCY = [1, 2];

export const discoverStoryInputSchema = z.object({
    sourceUrl: z.string().trim().url().max(2048),
    clientRequestId: z.string().uuid(),
});

export const configureImportInputSchema = z
    .object({
        jobId: z.string().uuid(),
        selectedEditionExternalId: z.string().min(1).max(100),
        targetStoryId: z.number().int().positive().nullable(),
        mode: z.enum(IMPORT_MODES),
        rangeStart: z.number().int().positive().nullable(),
        rangeEnd: z.number().int().positive().nullable(),
        requestedConcurrency: z.union([z.literal(1), z.literal(2)]),
    })
    .superRefine((value, context) => {
        if (value.mode !== "RANGE") return;
        if (value.rangeStart === null || value.rangeEnd === null) {
            context.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Khoảng chương chưa đầy đủ.",
            });
            return;
        }
        if (value.rangeStart > value.rangeEnd) {
            context.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Chương bắt đầu không được lớn hơn chương kết thúc.",
            });
        }
    });

export const importSingleChapterInputSchema = z.object({
    jobId: z.string().uuid(),
    chapterNumber: z.number().int().positive(),
});

export const startChapterImportBatchInputSchema = z.object({
    jobId: z.string().uuid(),
});

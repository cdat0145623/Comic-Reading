import { toPublicImportError } from "@mtc/importer";
import { NextResponse } from "next/server";

import { getStoryImportProgress } from "@/lib/dal/story-import";

export async function GET(_request, { params }) {
    const { jobId } = await params;
    try {
        const data = await getStoryImportProgress(jobId);
        return NextResponse.json(
            { ok: true, data },
            { headers: { "Cache-Control": "no-store" } },
        );
    } catch (error) {
        const publicError = toPublicImportError(error, {
            operation: "RESTORE_IMPORT",
            context: { jobId },
        });
        return NextResponse.json(
            { ok: false, error: publicError },
            {
                status:
                    publicError.code === "SESSION_EXPIRED"
                        ? 401
                        : publicError.code === "IMPORT_NOT_FOUND"
                          ? 404
                          : 500,
            },
        );
    }
}

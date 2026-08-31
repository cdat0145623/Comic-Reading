import { randomUUID } from "node:crypto";

import { ZodError } from "zod";

const OPERATION_FALLBACK_MESSAGES = {
    DISCOVER_SOURCE: "Không thể phân tích nguồn truyện.",
    CONFIGURE_IMPORT: "Không thể lưu cấu hình import.",
    RESTORE_IMPORT: "Không thể khôi phục phiên import.",
    IMPORT_SINGLE_CHAPTER: "Không thể tải chapter mẫu.",
    START_IMPORT_BATCH: "Không thể bắt đầu nhập chapter.",
};

const DATABASE_ERROR_CODES = {
    P1001: {
        code: "DATABASE_UNAVAILABLE",
        message: "Hệ thống hiện không thể kết nối cơ sở dữ liệu.",
    },
    P1002: {
        code: "DATABASE_TIMEOUT",
        message: "Cơ sở dữ liệu phản hồi quá thời gian cho phép.",
    },
    P2002: {
        code: "IMPORT_CONFLICT",
        message: "Dữ liệu import vừa được cập nhật. Vui lòng tải lại.",
    },
    P2024: {
        code: "DATABASE_TIMEOUT",
        message: "Hệ thống đang bận xử lý dữ liệu. Vui lòng thử lại.",
    },
    P2025: {
        code: "IMPORT_NOT_FOUND",
        message: "Dữ liệu import không còn tồn tại.",
    },
};

function inferCategory(code) {
    if (
        code.startsWith("SOURCE_") ||
        code === "CATALOG_DUPLICATE_ID" ||
        code === "UNSUPPORTED_SOURCE_EDITION"
    ) {
        return "SOURCE";
    }
    if (
        code.startsWith("INVALID_") ||
        code === "UNSUPPORTED_SOURCE" ||
        code === "IMPORT_CHAPTER_OUTSIDE_RANGE" ||
        code.endsWith("_NOT_FOUND")
    ) {
        return "VALIDATION";
    }
    if (code.startsWith("DATABASE_")) return "DATABASE";
    if (
        code.includes("CONFLICT") ||
        code.includes("AMBIGUOUS") ||
        code === "IMPORT_JOB_NOT_CONFIGURABLE"
    ) {
        return "CONFLICT";
    }
    if (code === "SESSION_EXPIRED") return "AUTH";
    if (code.endsWith("_FORBIDDEN")) return "AUTH";
    return "INTERNAL";
}

function createSupportId() {
    return `IMP-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

function logInternalImportError({
    error,
    operation,
    supportId,
    context,
}) {
    console.error("[importer]", {
        supportId,
        operation,
        context,
        errorName: error?.name,
        errorCode: error?.code,
        message: error?.message,
        stack: error?.stack,
        cause: error?.cause,
    });
}

export class ImportDiscoveryError extends Error {
    constructor(
        code,
        message,
        {
            cause,
            category = inferCategory(code),
            retryable = false,
        } = {},
    ) {
        super(message, cause ? { cause } : undefined);
        this.name = "ImportDiscoveryError";
        this.code = code;
        this.category = category;
        this.retryable = retryable;
    }
}

export function toPublicImportError(
    error,
    { operation = "DISCOVER_SOURCE", context = {} } = {},
) {
    if (error instanceof ImportDiscoveryError) {
        return {
            code: error.code,
            category: error.category,
            message: error.message,
            retryable: error.retryable,
            supportId: null,
        };
    }

    if (error instanceof ZodError) {
        const firstIssue = error.issues[0];
        const field = firstIssue?.path?.join(".");
        return {
            code: "INVALID_IMPORT_INPUT",
            category: "VALIDATION",
            message: field
                ? `Dữ liệu ${field} không hợp lệ: ${firstIssue.message}`
                : "Dữ liệu import không hợp lệ.",
            retryable: false,
            supportId: null,
        };
    }

    const databaseError = DATABASE_ERROR_CODES[error?.code];
    if (databaseError) {
        const supportId = createSupportId();
        logInternalImportError({
            error,
            operation,
            supportId,
            context,
        });
        return {
            ...databaseError,
            category:
                databaseError.code === "IMPORT_CONFLICT" ||
                databaseError.code === "IMPORT_NOT_FOUND"
                    ? "CONFLICT"
                    : "DATABASE",
            retryable: [
                "DATABASE_UNAVAILABLE",
                "DATABASE_TIMEOUT",
            ].includes(databaseError.code),
            supportId,
        };
    }

    const supportId = createSupportId();
    logInternalImportError({
        error,
        operation,
        supportId,
        context,
    });
    return {
        code: "INTERNAL_IMPORT_ERROR",
        category: "INTERNAL",
        message:
            OPERATION_FALLBACK_MESSAGES[operation] ||
            "Không thể xử lý yêu cầu import.",
        retryable: true,
        supportId,
    };
}

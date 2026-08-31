"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function StoryImportError({ reset }) {
    return (
        <section className="border border-danger/30 bg-surface p-8 text-center">
            <AlertTriangle className="mx-auto text-danger" size={28} />
            <h1 className="mt-4 text-xl font-bold">
                Không thể mở trình nhập truyện
            </h1>
            <p className="mx-auto mt-2 max-w-lg text-sm text-muted">
                Dữ liệu khởi tạo không tải được. Hãy thử lại; job đang chạy trong
                worker không bị hủy bởi lỗi hiển thị này.
            </p>
            <Button className="mt-5" onClick={reset}>
                <RotateCcw size={16} />
                Thử lại
            </Button>
        </section>
    );
}

"use client";

import { useEffect } from "react";

function Error({ error, reset }) {
    useEffect(() => {
        console.error("Application error", error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center p-4 text-center">
            <h2 className="mb-4 text-3xl font-bold">Đã xảy ra lỗi</h2>
            <p className="mb-6 mt-3 text-xl text-gray-600">
                Không thể tải dữ liệu. Vui lòng thử lại sau ít phút.
            </p>
            <button
                type="button"
                onClick={reset}
                className="cursor-pointer rounded bg-panel px-4 py-2 text-xl text-black hover:bg-primary hover:text-white"
            >
                Thử lại
            </button>
        </div>
    );
}

export default Error;

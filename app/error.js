"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

function Error({ error, reset }) {
    const router = useRouter();
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className=" flex flex-col items-center justify-center text-center p-4">
            <h2 className="text-3xl font-bold mb-4">🚫 Đã xảy ra lỗi!</h2>
            <p className="mt-3 mb-6 text-gray-600 text-xl">
                {error.message ||
                    "Có lỗi không xác định đã xảy ra. Vui lòng thử lại."}
            </p>
            <button
                onClick={() => router.back()}
                className="px-4 py-2 bg-panel text-black rounded hover:text-white hover:bg-primary text-xl cursor-pointer"
            >
                Quay lại trang trước
            </button>
        </div>
    );
}

export default Error;

"use client";

import { useRouter } from "next/navigation";
function ParamsNotFound() {
    const router = useRouter();
    return (
        <div className="flex flex-col items-center justify-center p-4">
            <h2 className="text-xl font font-medium mb-4">
                Bạn đã chọn trường chứa dữ liệu không phù hợp
            </h2>
            <button
                onClick={() => router.back()}
                className="px-4 py-2 bg-panel text-black rounded hover:text-white hover:bg-primary text-xl cursor-pointer"
            >
                Nhấn vào đây để quay lại trang cũ
            </button>
        </div>
    );
}

export default ParamsNotFound;

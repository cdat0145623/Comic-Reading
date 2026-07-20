"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

function NotFound() {
    const router = useRouter();
    return (
        <main className="text-center space-y-6 mt-4">
            <h1 className="text-3xl font-semibold">
                This page could not be found :(
            </h1>
            <button
                onClick={() => router.back()}
                className="inline-block bg-accent-500 text-primary-800 px-6 py-3 text-lg hover:text-primary bg-panel rounded"
            >
                Quay lại
            </button>
        </main>
    );
}

export default NotFound;

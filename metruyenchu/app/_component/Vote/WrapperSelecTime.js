"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import SelectTime from "../SelecTime";
import { useTransition } from "react";
import Spinner from "../Spinner";

function setParams(params, entries) {
    for (const [key, value] of Object.entries(entries)) {
        params.set(key, value);
    }
}

function WrapperSelecTime() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();

    const handleTimeChange = (month, year) => {
        const params = new URLSearchParams(searchParams);
        setParams(params, {
            month: month,
            year: year,
        });
        startTransition(() => {
            router.replace(`${pathname}?${params.toString()}`, {
                scroll: false,
            });
        });
    };
    return (
        <>
            <div className="flex items-center justify-between">
                <h2 className="text-primary uppercase text-sm">
                    Bảng Xếp Hạng Đề Cử
                </h2>
                <SelectTime onTimeChange={handleTimeChange} />
            </div>
            {isPending && <Spinner />}
        </>
    );
}

export default WrapperSelecTime;

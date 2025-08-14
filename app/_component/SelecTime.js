"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const yearOptions = [2023, 2024, 2025];

function setParams(params, entries) {
    for (const [key, value] of Object.entries(entries)) {
        params.set(key, value);
    }
}
function SelectTime() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const searchMonth = searchParams.get("month") || new Date().getMonth() + 1;
    const searchYear = searchParams.get("year") || new Date().getFullYear();

    const [month, setMonth] = useState(searchMonth);
    const [year, setYear] = useState(searchYear);

    useEffect(() => {
        const currentMonth = searchParams.get("month");
        const currentYear = searchParams.get("year");

        if (month === currentMonth && year === currentYear) return;

        const params = new URLSearchParams(searchParams);
        setParams(params, {
            month: month,
            year: year,
        });
        router.push(`?${params.toString()}`, { scroll: false });
    }, [month, year]);

    return (
        <div className="flex space-x-2">
            <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-24 rounded-md border border-gray-300 text-xs custom-select-arrow"
            >
                {Array.from({ length: 12 }).map((_, index) => (
                    <option value={index + 1} key={index}>
                        {index + 1}
                    </option>
                ))}
            </select>
            <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-24 rounded-md border border-gray-300 text-xs custom-select-arrow"
            >
                {yearOptions.map((year) => (
                    <option value={year} key={year}>
                        {year}
                    </option>
                ))}
            </select>
        </div>
    );
}

export default SelectTime;

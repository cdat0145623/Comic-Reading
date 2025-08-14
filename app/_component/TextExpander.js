"use client";

import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

function TextExpander({ children, maxLines = 10, lineHeightPx = 24 }) {
    const contentRef = useRef(null);
    const [isExpended, setIsExpended] = useState(false);
    const [shouldShowButton, setShouldShowButton] = useState(false);
    const [contentHeight, setContentHeight] = useState(0);

    const collapsedHeight = maxLines * lineHeightPx;

    useEffect(() => {
        if (contentRef.current) {
            const fullHeight = contentRef.current.scrollHeight;

            const visibleHeight = collapsedHeight;

            setContentHeight(fullHeight);
            setShouldShowButton(fullHeight > visibleHeight);
        }
    }, [children, collapsedHeight]);

    return (
        <div className="relative">
            <div
                ref={contentRef}
                className={clsx(
                    "overflow-hidden transition-all duration-300 ease-in-out",
                    !isExpended &&
                        "shadow-[inset_0_-20px_20px_-20px_rgba(255,255,255,1)]"
                )}
                style={{
                    maxHeight: isExpended ? contentHeight : collapsedHeight,
                }}
            >
                <p className="text-gray-700 whitespace-pre-wrap break-words transition-all text-base leading-6">
                    {children}
                </p>
            </div>
            {shouldShowButton && (
                <button
                    className="text-xs text-yellow-700 hover:text-yellow-500 font-bold cursor-pointer"
                    onClick={() => setIsExpended((prev) => !prev)}
                >
                    {isExpended ? "Thu gọn" : "Đọc tiếp"}
                </button>
            )}
        </div>
    );
}

export default TextExpander;

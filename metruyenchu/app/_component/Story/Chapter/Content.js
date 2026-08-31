"use client";
import { breakSentences } from "@/app/_lib/helper";

function Content({ chapter, slug }) {
    return (
        <div
            className="p-4 transition-colors duration-200"
            style={{
                backgroundColor: "var(--app-surface)",
                color: "var(--app-text)",
                fontFamily: "var(--reader-font-family)",
                fontSize: "var(--reader-font-size)",
                lineHeight: "var(--reader-line-height)",
            }}
        >
            <p className="whitespace-pre-line break-words">
                {breakSentences(
                    chapter?.chapters[0]?.name,
                    chapter?.chapters[0].content,
                )}
            </p>
        </div>
    );
}

export default Content;

"use client";
import { useSession } from "next-auth/react";

import ReadingList from "./ReadingList";
import SectionLink from "../../SectionLink";

function Reading() {
    const { data: user, status } = useSession();
    // console.log("Reading component status:", status);

    return (
        <div className="flex flex-wrap">
            {status === "authenticated" && (
                <>
                    <SectionLink title="Truyện Vừa Đọc" href="#" icon />
                    <ReadingList user={user.user} />
                </>
            )}
        </div>
    );
}

export default Reading;

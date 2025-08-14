import { Suspense } from "react";
import SectionLink from "../../SectionLink";
import Loading from "./Loading";
import ChapterUpdated from "./ChapterUpdated";

export const revalidate = 600;

function RecentlyUpdatedChapter() {
    return (
        <div className="mt-5">
            <SectionLink
                title="Vừa lên chương"
                href="/danh-sach/truyen-moi"
                icon
            />
            <Suspense fallback={<Loading />}>
                <ChapterUpdated />
            </Suspense>
        </div>
    );
}

export default RecentlyUpdatedChapter;

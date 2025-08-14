import { Suspense } from "react";
import SectionLink from "../../SectionLink";
import Spinner from "../../Spinner";
import ListRecentlyCompleted from "./ListRecentlyCompleted";

function TopRecentlyCompleted() {
    return (
        <div className="mt-5">
            <SectionLink
                title="Mới hoàn thành"
                href="/danh-sach/truyen-full"
                icon
            />
            <Suspense fallback={<Spinner />}>
                <ListRecentlyCompleted />
            </Suspense>
        </div>
    );
}

export default TopRecentlyCompleted;

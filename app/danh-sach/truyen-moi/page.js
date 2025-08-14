import NewChapter from "@/app/_component/NewChapter/NewChapter";
import SectionLink from "@/app/_component/SectionLink";
import Spinner from "@/app/_component/Spinner";
import { Suspense } from "react";

async function Page(props) {
    const searchParams = await props.searchParams;
    return (
        <div className="mt-6 space-y-5">
            <SectionLink title="Truyện Mới Cập Nhật" href="/danh-sach" icon />
            <Suspense fallback={<Spinner />} key={`${searchParams?.page}`}>
                <NewChapter searchParams={searchParams} />
            </Suspense>
        </div>
    );
}

export default Page;

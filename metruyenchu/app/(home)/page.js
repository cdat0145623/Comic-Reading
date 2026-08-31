import FooterBanner from "../_component/FooterBanner";
import Appreciate from "@/app/_component/Home/Appreciate/Appreciate";
import Reading from "@/app/_component/Home/Reading/Reading";
import RecentlyUpdatedChapter from "@/app/_component/Home/RecentlyUpdated/RecentlyUpdatedChapter";
import Recommend from "@/app/_component/Home/Recommend/Recommend";
import TopRealtime from "@/app/_component/Home/TopRealtime/TopRealtime";
import TopRecentlyCompleted from "@/app/_component/Home/TopRecentlyCompleted/TopRecentlyCompleted";
import TopVote from "@/app/_component/Home/Vote/TopVote";
import SubBanner from "@/app/_component/SubBanner";

export default async function Home() {
    return (
        <>
            <Reading />
            <Recommend />
            <SubBanner />
            <div className="mt-5">
                <div className="lg:grid lg:grid-cols-2 sm:grid-cols-1 gap-x-5">
                    <TopRealtime />
                    <TopVote />
                </div>
            </div>
            <RecentlyUpdatedChapter />
            <FooterBanner />
            <TopRecentlyCompleted />
            <Appreciate />
        </>
    );
}

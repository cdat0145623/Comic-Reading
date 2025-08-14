import FooterBanner from "./_component/FooterBanner";
import Appreciate from "./_component/Home/Appreciate/Appreciate";
import Reading from "./_component/Home/Reading/Reading";
import RecentlyUpdatedChapter from "./_component/Home/RecentlyUpdated/RecentlyUpdatedChapter";
import Recommend from "./_component/Home/Recommend/Recommend";
import TopRealtime from "./_component/Home/TopRealtime/TopRealtime";
import TopRecentlyCompleted from "./_component/Home/TopRecentlyCompleted/TopRecentlyCompleted";
import TopVote from "./_component/Home/Vote/TopVote";
import SubBanner from "./_component/SubBanner";

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

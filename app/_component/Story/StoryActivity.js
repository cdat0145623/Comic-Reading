import { Suspense } from "react";
import { countBy } from "@/app/_lib/data-service";
import Rating from "./Activity/Rating/Rating";
import Tabs from "./Tabs";
import Comment from "./Activity/Comment/Comment";
import Fan from "./Activity/Fan/Fan";

export default async function StoryActivity({
    activeTab,
    display,
    filter,
    slug,
    storyId,
}) {
    console.log("activeTab:", activeTab);
    const { ratingsCount, commentsCount, fansCount } = await countBy({
        storyId,
    });

    return (
        <div>
            <Tabs
                ratingsCount={ratingsCount}
                commentsCount={commentsCount}
                fansCount={fansCount}
            />
            <div className="mt-6 mx-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 md:gap-y-4 gap-y-6 gap-6">
                <Suspense fallback={<div>Loading....</div>} key={activeTab}>
                    {activeTab === "ratings" && (
                        <Rating
                            ratingsCount={ratingsCount}
                            activeTab={activeTab}
                            storyId={storyId}
                            slug={slug}
                            display={display}
                            filter={filter}
                        />
                    )}
                    {activeTab === "comments" && (
                        <Comment
                            activeTab={activeTab}
                            commentsCount={commentsCount}
                            storyId={storyId}
                            filter={filter}
                        />
                    )}
                    {activeTab === "fans" && (
                        <Fan
                            storyId={storyId}
                            activeTab={activeTab}
                            fansCount={fansCount}
                        />
                    )}
                </Suspense>
            </div>
        </div>
    );
}

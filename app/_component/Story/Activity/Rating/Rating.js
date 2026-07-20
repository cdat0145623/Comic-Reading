import FormRating from "../../FormRating";
import RatingSection from "./RatingSection";

async function Rating({
    slug,
    storyId,
    activeTab,
    display,
    filter,
}) {
    return (
        <div className="grid col-span-full">
            <FormRating
                storyId={storyId}
                slug={slug}
                filter={filter}
                display={display}
            />
            <RatingSection
                activeTab={activeTab}
                storyId={storyId}
                display={display}
                filter={filter}
            />
        </div>
    );
}

export default Rating;

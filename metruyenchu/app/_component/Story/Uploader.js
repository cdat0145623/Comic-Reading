import SectionLink from "../SectionLink";
import UpLoaderCard from "./UpLoaderCard";

function Uploader({ uploader, storyId }) {
    const uploadedStories = uploader?.uploadedStories
        .filter((story) => story.id !== storyId)
        .slice(0, 5);
    return (
        <div>
            <SectionLink
                background
                text="xem thêm"
                title="Cùng đăng bởi"
                uploader={uploader.name}
                icon
                className="px-3 py-2"
                href={`/ho-so/${uploader.id}`}
            />
            <div className="mx-2 mt-5">
                <div className="grid grid-cols-5 md:grid-cols-5 gap-5 items-stretch">
                    {uploadedStories.map((story) => (
                        <UpLoaderCard story={story} key={story.id} />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Uploader;

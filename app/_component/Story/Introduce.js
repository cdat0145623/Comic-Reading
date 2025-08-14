import { handleSentences } from "@/app/_lib/data-service";
import SectionLink from "../SectionLink";

function Introduce({ introduce }) {
    return (
        <>
            <SectionLink
                title="GIỚI THIỆU"
                background
                text
                className="px-3 py-2"
            />
            <div className="py-4 md:px-1 px-2 text-base text-gray-600">
                <p className="whitespace-pre-line leading-relaxed">
                    {handleSentences(introduce)}
                </p>
            </div>
        </>
    );
}

export default Introduce;

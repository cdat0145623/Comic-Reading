import CardRealtime from "./CardRealtime";
import Top1Card from "./Top1Card";
import Top2To3Card from "./Top2To3Card";

function ListRealtime({ topStories }) {
    if (topStories?.length === 0)
        return <p className="text-center italic text-sm">Chưa có dữ liệu.</p>;

    const [top1, ...rest] = topStories.slice(0, 10);
    const top2to3 = rest.slice(0, 2);
    const top4to10 = rest.slice(2);

    return (
        <div className="divide-y divide-dotted divide-slate-200 box-content">
            <Top1Card story={top1} />
            {top2to3.map((story, index) => (
                <Top2To3Card story={story} key={index} rank={index + 2} />
            ))}
            {top4to10.map((story, index) => (
                <CardRealtime story={story} key={index} rank={index + 4} />
            ))}
        </div>
    );
}

export default ListRealtime;

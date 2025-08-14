function CardRealtime({ story, rank }) {
    return (
        <div className="divide-y divide-dotted divide-slate-200 box-content">
            <div className="flex p-3 space-x-2 items-center">
                <div className="text-sm text-center w-6">
                    <span>{rank}</span>
                </div>
                <a href="#" className="w-full">
                    <span className="text-title-color text-sm hover:text-primary">
                        {story.title}
                    </span>
                </a>
                <div>
                    <span className="text-gray-500 text-sm">
                        {story.readerCount}
                    </span>
                </div>
            </div>
        </div>
    );
}

export default CardRealtime;

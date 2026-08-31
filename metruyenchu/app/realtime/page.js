"use client";
import { useEffect, useState } from "react";
import SelectMinutes from "../_component/SelectMinutes";
import { fetchTopStories } from "../_lib/api";
import Spinner from "../_component/Spinner";
import Top1To3Reading from "../_component/RealTime/Top1To3Reading";
import Top4Reading from "../_component/RealTime/Top4Reading";
import { useFetchWithMinLoading } from "../hooks/useFetchWithMinLoading";

function Page() {
    const [minutes, setMinutes] = useState(15);

    const { data: topStories, loading } = useFetchWithMinLoading(
        () => fetchTopStories(minutes, 100),
        [minutes],
        500
    );
    // {console.log("Realtime have limit and minutes:::", topStories)}
    return (
        <div className="grid grid-cols-1 gap-6 lg:px-0 px-4">
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <h2 className="text-primary uppercase text-sm">
                        Đang đọc theo thời gian thực
                    </h2>
                    <SelectMinutes minutes={minutes} setMinutes={setMinutes} />
                </div>
                {loading ? (
                    <Spinner />
                ) : (
                    <>
                        {topStories.length === 0 ? (
                            <div className="mt-4">
                                <p className="text-center italic text-sm">
                                    Chưa có dữ liệu.
                                </p>
                            </div>
                        ) : (
                            topStories?.map((story, index) => (
                                <>
                                    <div
                                        className="grid grid-cols-1 gap-6"
                                        key={story.storyId}
                                    >
                                        {index + 1 <= 3 ? (
                                            <Top1To3Reading
                                                story={story}
                                                index={index}
                                            />
                                        ) : (
                                            <Top4Reading
                                                story={story}
                                                index={index}
                                            />
                                        )}
                                    </div>
                                </>
                            ))
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default Page;

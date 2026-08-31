"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import { Pagination } from "swiper/modules";
import RecommendCard from "./RecommendCard";
function RecommendList({ stories }) {
    const chunks = Array.from(
        { length: Math.ceil(stories.length / 6) },
        (_, i) => stories.slice(i * 6, i * 6 + 6)
    );
    return (
        <Swiper
            pagination={{ clickable: true }}
            modules={[Pagination]}
            slidesPerView={1}
            spaceBetween={30}
        >
            {chunks.map((chunk, index) => (
                <SwiperSlide key={index}>
                    <div className="grid grid-cols-2">
                        {chunk.map((story) => (
                            <RecommendCard key={story.storyId} story={story} />
                        ))}
                    </div>
                </SwiperSlide>
            ))}
        </Swiper>
    );
}

export default RecommendList;

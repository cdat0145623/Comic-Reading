"use client";
import { Swiper, SwiperSlide } from "swiper/react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/pagination";

// import required modules
import { FreeMode, Pagination } from "swiper/modules";
import RecentlyCompletedCard from "./RecentlyCompletedCard";
function SwiperCompleted({ topStoriesComplete }) {
    return (
        <Swiper
            slidesPerView={5.5}
            spaceBetween={30}
            freeMode={true}
            modules={[FreeMode]}
            className="mySwiper"
            onSwiper={(swiper) => {
                swiper.wrapperEl.classList.add(
                    "grid",
                    "grid-cols-3",
                    "sm:grid-cols-4",
                    "md:grid-cols-5",
                    "pl-3"
                );
                // swiper.slides.forEach((slideEl) => {
                //     slideEl.classList.add("w-[162px]"); // 🎯 Đây là swiper-slide
                // });
            }}
            breakpoints={{
                640: {
                    slidesPerView: 3.5,
                },
                720: {
                    slidesPerView: 4.5,
                },
                1024: {
                    slidesPerView: 5.5,
                },
            }}
        >
            {topStoriesComplete.map((story) => (
                <SwiperSlide key={story.id}>
                    <RecentlyCompletedCard story={story} />
                </SwiperSlide>
            ))}
        </Swiper>
    );
}

export default SwiperCompleted;

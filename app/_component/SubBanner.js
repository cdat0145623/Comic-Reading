import Image from "next/image";
import Link from "next/link";
import sub_banner from "@/public/sub_banner.webp";

function SubBanner() {
    return (
        <div>
            <Link href="https://metruyencv.com/truyen/co-len-a-vo-bac-si">
                <Image
                    src={sub_banner}
                    className="w-full"
                    alt="Banner main"
                    quality={80}
                />
            </Link>
        </div>
    );
}

export default SubBanner;

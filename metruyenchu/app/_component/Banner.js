import banner from "@/public/banner-main.webp";
import Image from "next/image";
import Link from "next/link";
function Banner() {
    return (
        <div>
            <Link href="#">
                <Image
                    src={banner}
                    className="w-full"
                    alt="Banner main"
                    quality={80}
                />
            </Link>
        </div>
    );
}

export default Banner;

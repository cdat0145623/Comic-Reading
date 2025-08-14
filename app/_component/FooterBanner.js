import Image from "next/image";
import Link from "next/link";
import sub_banner from "@/public/sub_banner_3.webp";

function FooterBanner() {
    return (
        <div>
            <Link href="#">
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

export default FooterBanner;

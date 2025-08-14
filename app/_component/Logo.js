import Image from "next/image";
import Link from "next/link";
import logo from "@/public/logo.png";

function Logo() {
    return (
        <Link href="/">
            <Image
                src={logo}
                height={40}
                width={40}
                alt="Image me truyen chu"
                quality={100}
            />
        </Link>
    );
}

export default Logo;

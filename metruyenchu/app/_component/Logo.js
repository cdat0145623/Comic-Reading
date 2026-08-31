import Image from "next/image";
import logo from "@/public/logo.png";
import NavigationLink from "./NavigationLink";

function Logo() {
    return (
        <NavigationLink href="/" aria-label="Trang chủ">
            <Image
                src={logo}
                height={40}
                width={40}
                alt="Image me truyen chu"
                quality={100}
            />
        </NavigationLink>
    );
}

export default Logo;

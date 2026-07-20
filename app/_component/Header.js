import SideBarHeader from "./SideBarHeader";
import Logo from "./Logo";
import SearchIcon from "./SearchIcon";
import NavigationLink from "./NavigationLink";
import { MapIcon } from "@heroicons/react/24/outline";

async function Header() {
    return (
        <header className="app-surface relative z-40 border-b border-gray-500">
            <div className="relative p-2">
                <div className="grid grid-cols-[1fr_auto_1fr] items-center">
                    <div className="flex items-center gap-2 justify-self-start">
                        <SearchIcon />
                        <NavigationLink
                            href="/kham-pha"
                            aria-label="Khám phá truyện"
                            title="Khám phá truyện"
                            className="rounded-md p-1.5 text-title-color transition-colors hover:bg-[var(--app-primary-soft)] hover:text-primary"
                        >
                            <MapIcon className="h-6 w-6" />
                        </NavigationLink>
                    </div>
                    <Logo />
                    <div className="justify-self-end">
                        <SideBarHeader />
                    </div>
                </div>
            </div>
        </header>
    );
}

export default Header;

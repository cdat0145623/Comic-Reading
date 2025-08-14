import SideBarHeader from "./SideBarHeader";
import Logo from "./Logo";
import { MagnifyingGlassIcon } from "@heroicons/react/24/solid";

import SearchIcon from "./SearchIcon";

async function Header() {
    return (
        <header className="border-b border-gray-500">
            <div className="p-2">
                <div className="flex items-center justify-between">
                    <SearchIcon />
                    <Logo />
                    <SideBarHeader />
                </div>
                <div className="py-4 h-16 hidden">
                    <div className="relative">
                        <div>
                            <input
                                type="text"
                                placeholder="tên truyện, tác giả..."
                                className="h-10 w-full pl-5 pr-10 placeholder-slate-400 text-sm focus:outline-none border border-slate-300 focus:ring-1 focus:ring-primary rounded"
                            />
                            <button className="absolute inset-y-0 right-0 rounded-r-lg p-2 text-primary">
                                <MagnifyingGlassIcon className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}

export default Header;

import Link from "next/link";

function SideBar() {
    return (
        <div className="md:col-span-1">
            <div className="bg-slate-100 p-4 rounded-lg">
                <nav className="flex flex-col flex-1">
                    <ul className="space-y-1">
                        <li>
                            <Link
                                href="#"
                                className="p-2 flex gap-x-3 text-sm bg-panel rounded-md leading-6 font-semibold"
                            >
                                <span className="flex items-center justify-center w-6 h-6 uppercase border border-primary rounded-lg text-[0.625rem] font-medium text-primary">
                                    l
                                </span>
                                <span className="text-primary">Lượt Đọc</span>
                            </Link>
                        </li>
                        <li className="hover:text-primary">
                            <Link
                                href="#"
                                className="p-2 flex gap-x-3 text-sm bg-panel rounded-md leading-6 font-semibold"
                            >
                                <span className="flex items-center justify-center w-6 h-6 uppercase border border-stone-900 hover:border-primary rounded-lg text-[0.625rem] font-medium">
                                    đ
                                </span>
                                <span>Đề Cử</span>
                            </Link>
                        </li>
                        <li className="hover:text-primary">
                            <Link
                                href="#"
                                className="p-2 flex gap-x-3 text-sm bg-panel rounded-md leading-6 font-semibold"
                            >
                                <span className="flex items-center justify-center w-6 h-6 uppercase border border-stone-900 hover:border-primary rounded-lg text-[0.625rem] font-medium">
                                    m
                                </span>
                                <span>Mở Khóa</span>
                            </Link>
                        </li>
                        <li className="hover:text-primary">
                            <Link
                                href="#"
                                className="p-2 flex gap-x-3 text-sm bg-panel rounded-md leading-6 font-semibold"
                            >
                                <span className="flex items-center justify-center w-6 h-6 uppercase border border-stone-900 hover:border-primary rounded-lg text-[0.625rem] font-medium">
                                    t
                                </span>
                                <span>Tặng Thưởng</span>
                            </Link>
                        </li>
                        <li className="hover:text-primary">
                            <Link
                                href="#"
                                className="p-2 flex gap-x-3 text-sm bg-panel rounded-md leading-6 font-semibold"
                            >
                                <span className="flex items-center justify-center w-6 h-6 uppercase border border-stone-900 hover:border-primary rounded-lg text-[0.625rem] font-medium">
                                    b
                                </span>
                                <span>Bình Luận</span>
                            </Link>
                        </li>
                    </ul>
                </nav>
            </div>
        </div>
    );
}

export default SideBar;

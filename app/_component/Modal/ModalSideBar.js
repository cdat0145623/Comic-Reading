"use client";
import { SunIcon } from "@heroicons/react/24/outline";
import { MoonIcon } from "@heroicons/react/24/outline";
import { BookOpenIcon } from "@heroicons/react/24/outline";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { SquaresPlusIcon } from "@heroicons/react/24/outline";
import { PresentationChartLineIcon } from "@heroicons/react/24/outline";
import { NumberedListIcon } from "@heroicons/react/24/outline";
import { NewspaperIcon } from "@heroicons/react/24/outline";

import { KeyIcon } from "@heroicons/react/24/solid";
import { TicketIcon } from "@heroicons/react/24/solid";

import Image from "next/image";
import Link from "next/link";
import Modal from "./Modal";
import { handleLogoutWithToast } from "@/lib/handleLoginWithToast";
import { usePathname } from "next/navigation";
import { useState } from "react";
import ThemeSelector from "../Appearance/ThemeSelector";
import { useAppearance } from "../Appearance/AppearanceProvider";
import NavigationLink from "../NavigationLink";

function ModalSideBar({ user, onCloseModal }) {
    const pathname = usePathname();
    const { theme } = useAppearance();
    const [isThemePickerOpen, setIsThemePickerOpen] = useState(false);
    const ThemeIcon =
        theme === "dark" ? MoonIcon : theme === "sepia" ? BookOpenIcon : SunIcon;

    const handleLogout = async () => {
        handleLogoutWithToast({ pathname });
        onCloseModal();
    };

    return (
        <div className="scrollbar-hidden app-panel flex h-full flex-col overflow-y-auto py-6 shadow-xl">
            <div className="px-6">
                <div className="flex items-center justify-between">
                    <div className="relative">
                        <button
                            type="button"
                            className="rounded p-1 text-primary hover:bg-[var(--app-primary-soft)]"
                            onClick={() =>
                                setIsThemePickerOpen((isOpen) => !isOpen)
                            }
                            aria-expanded={isThemePickerOpen}
                            aria-label="Đổi màu giao diện"
                        >
                            <ThemeIcon className="h-6 w-6" />
                        </button>
                        {isThemePickerOpen && (
                            <div className="app-panel absolute left-0 z-10 mt-2 w-48 rounded-md border p-2 shadow-xl">
                                <ThemeSelector compact />
                            </div>
                        )}
                    </div>

                    <div>
                        <button
                            className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                            onClick={onCloseModal}
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-2 px-6 divide-y divide-slate-100 flex-1">
                {user ? (
                    <div className="space-y-2 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Image
                                    src="/image_user.jpg"
                                    alt=""
                                    width={24}
                                    height={24}
                                    className="w-6 h-6 rounded-full"
                                />
                                <div className="flex items-center space-x-2">
                                    <h2 className="font-semibold text-sm">
                                        <a href="#"> nguyễn đạt </a>
                                    </h2>
                                    <a
                                        href="#"
                                        className="w-6 h-6 rounded-full bg-red-700 flex items-center justify-center text-xs font-semibold text-white"
                                    >
                                        0
                                    </a>
                                </div>
                            </div>

                            <button
                                className="rounded border border-primary text-xs px-2 py-1 text-primary"
                                onClick={handleLogout}
                            >
                                Thoát
                            </button>
                        </div>

                        <div className="mx-10">
                            <ul className="text-sm divide-y divide-slate-100 list-disc list-inside">
                                <li className="py-2">
                                    <a href="#">
                                        <span>Nâng cấp tài khoản</span>
                                        <Image
                                            src="/img_new.png"
                                            alt=""
                                            width={20}
                                            height={20}
                                            className="w-5 h-5 inline-flex ms-2"
                                        />
                                    </a>
                                </li>
                                <li className="py-2">
                                    <NavigationLink
                                        href="/tai-khoan/tu-truyen"
                                        onClick={onCloseModal}
                                    >
                                        Tủ truyện của tôi
                                    </NavigationLink>
                                </li>
                                <li className="py-2">
                                    <a href="#">Lịch sử giao dịch</a>
                                </li>
                                <li className="py-2">
                                    <NavigationLink
                                        href="/tai-khoan/cai-dat"
                                        onClick={onCloseModal}
                                    >
                                        Cài đặt cá nhân
                                    </NavigationLink>
                                </li>
                                <li className="py-2">
                                    <a href="#">Yêu cầu hỗ trợ</a>
                                </li>
                            </ul>

                            <div className="py-2 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <Image
                                            src="/candy.png"
                                            alt=""
                                            width={20}
                                            height={20}
                                        />
                                        <span className="text-sm">7,850</span>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm">0</span>
                                        <KeyIcon className="w-5 h-5 text-primary" />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <Image
                                            src="/candys.png"
                                            alt=""
                                            width={20}
                                            height={20}
                                        />
                                        <span className="text-sm">0</span>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm">2</span>
                                        <TicketIcon className="w-5 h-5 text-primary" />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-3">
                                <a
                                    href="#"
                                    className="flex items-center justify-center p-2 border border-primary rounded space-x-2 text-primary w-full"
                                >
                                    <span className="text-xl font-bold">
                                        Nạp
                                    </span>
                                    <Image
                                        src="/candy.png"
                                        alt=""
                                        width={32}
                                        height={32}
                                        className="w-8 h-8"
                                    />
                                </a>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="space-y-4">
                            <Modal.Open opens="signIn">
                                <button className="flex items-center space-x-2 text-sm font-semibold">
                                    Đăng nhập
                                </button>
                            </Modal.Open>
                            <Modal.Open opens="signUp">
                                <button className="flex items-center space-x-2 text-sm font-semibold">
                                    Đăng ký tài khoản
                                </button>
                            </Modal.Open>
                            <div></div>
                        </div>
                    </>
                )}

                <div className="py-4 space-y-4">
                    <div className="flex">
                        <h3 className="flex items-center space-x-2 text-sm font-semibold">
                            <PencilSquareIcon className="w-5 h-5" />
                            <Link href="#"> Đăng truyện </Link>
                        </h3>
                    </div>
                    <div className="border-b border-slate-100"></div>

                    <div>
                        <h3 className="flex items-center space-x-2 text-sm font-semibold">
                            <SquaresPlusIcon className="w-5 h-5" />
                            <NavigationLink
                                href="/kham-pha"
                                onClick={onCloseModal}
                            >
                                Kho truyện
                            </NavigationLink>
                        </h3>
                        <div className="mt-2 mx-10">
                            <ul className="list-disc list-inside text-sm divide-y divide-slate-100">
                                <li className="py-2">
                                    <NavigationLink
                                        href="/kham-pha?sort=updated"
                                        onClick={onCloseModal}
                                        className="pt-2"
                                    >
                                        Truyện mới
                                    </NavigationLink>
                                </li>
                                <li className="py-2">
                                    <NavigationLink
                                        href="/kham-pha?status=hoan-thanh"
                                        onClick={onCloseModal}
                                        className="pt-2"
                                    >
                                        Truyện full
                                    </NavigationLink>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div>
                        <h3 className="flex items-center space-x-2 text-sm font-semibold">
                            <NumberedListIcon className="w-5 h-5" />
                            <Link href="#">Xếp hạng</Link>
                        </h3>
                        <div className="mt-2 mx-10">
                            <ul className="list-disc list-inside text-sm divide-y divide-slate-100">
                                <li className="py-2">
                                    <a href="#" className="pt-2">
                                        Xếp hạng lượt đọc
                                    </a>
                                </li>
                                <li className="py-2">
                                    <a href="#" className="pt-2">
                                        Xếp hạng đề cử
                                    </a>
                                </li>
                                <li className="py-2">
                                    <a href="#" className="pt-2">
                                        Xếp hạng tặng thưởng
                                    </a>
                                </li>
                                <li className="py-2">
                                    <a href="#" className="pt-2">
                                        Xếp hạng bình luận
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-b border-slate-100"></div>

                    <div>
                        <h3 className="flex items-center space-x-2 text-sm font-semibold">
                            <PresentationChartLineIcon className="w-5 h-5" />
                            <Link href="#"> Thời gian thực </Link>
                        </h3>
                    </div>
                    <div className="border-b border-slate-100"></div>

                    <div>
                        <h3 className="flex items-center space-x-2 text-sm font-semibold">
                            <NewspaperIcon className="w-5 h-5" />
                            <Link href="#"> Đánh giá mới </Link>
                        </h3>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ModalSideBar;

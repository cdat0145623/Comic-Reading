"use client";
import { SunIcon } from "@heroicons/react/24/outline";
import { MoonIcon } from "@heroicons/react/24/outline";
import { ComputerDesktopIcon } from "@heroicons/react/24/outline";
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

function ModalSideBar({ user, onCloseModal }) {
    return (
        <div className="flex flex-col py-6 shadow-xl overflow-y-scroll h-full bg-secondary">
            <div className="px-6">
                <div className="flex items-center justify-between">
                    <div className="relative">
                        <button className="text-primary">
                            <SunIcon className="w-6 h-6" />
                        </button>
                        <div className="hidden absolute w-36 left-0 mt-3 rounded border border-gray-300 shadow-xl z-10">
                            <div className="p-3 space-y-4 text-sm">
                                <button className="flex items-center w-full text-black">
                                    <SunIcon className="size-6 mr-2" />
                                    <span className="ml-2">Ngày</span>
                                </button>
                                <button className="flex items-center w-full text-black">
                                    <MoonIcon className="size-6 mr-2" />
                                    <span className="ml-2">Đêm</span>
                                </button>
                                <button className="flex items-center w-full text-black">
                                    <ComputerDesktopIcon className="size-6 mr-2" />
                                    <span className="ml-2">Tự động</span>
                                </button>
                            </div>
                        </div>
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
                                onClick={() => {
                                    handleLogoutWithToast();
                                    onCloseModal();
                                }}
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
                                    <a href="#">Tủ truyện của tôi</a>
                                </li>
                                <li className="py-2">
                                    <a href="#">Lịch sử giao dịch</a>
                                </li>
                                <li className="py-2">
                                    <a href="#">Cài đặt cá nhân</a>
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
                            <a href="#">Kho truyện</a>
                        </h3>
                        <div className="mt-2 mx-10">
                            <ul className="list-disc list-inside text-sm divide-y divide-slate-100">
                                <li className="py-2">
                                    <Link href="#" className="pt-2">
                                        Truyện mới
                                    </Link>
                                </li>
                                <li className="py-2">
                                    <Link href="#" className="pt-2">
                                        Truyện full
                                    </Link>
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

"use client";
import Modal from "./Modal/Modal";
import ModalSideBar from "./Modal/ModalSideBar";

import Image from "next/image";
import { Bars3Icon } from "@heroicons/react/24/solid";
import { useSession } from "next-auth/react";

function SideBarHeader() {
    const { data: session, status } = useSession();

    return (
        <>
            <Modal.Open opens="sidebar">
                <button className="w-7 h-7">
                    {session?.user ? (
                        <Image
                            src={session?.user?.image || "/avatar_default.jpg"}
                            width={28}
                            height={28}
                            className="w-7 h-7 rounded-full"
                            alt={session?.user?.name || "Chua co name"}
                            quality={100}
                        />
                    ) : (
                        <Bars3Icon className="w-7 h-7" />
                    )}
                </button>
            </Modal.Open>

            <Modal.Window
                name="sidebar"
                variant="slide-right"
                className="w-screen h-screen"
            >
                <ModalSideBar user={session?.user} />
            </Modal.Window>
        </>
    );
}

export default SideBarHeader;

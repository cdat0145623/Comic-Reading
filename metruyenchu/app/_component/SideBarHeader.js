"use client";
import Modal from "./Modal/Modal";
import ModalSideBar from "./Modal/ModalSideBar";

import Image from "next/image";
import { Bars3Icon } from "@heroicons/react/24/solid";
import { useSession } from "next-auth/react";
import { generateImageUrl } from "../_lib/helper";

function SideBarHeader() {
    const { data: session, status } = useSession();
    // console.log("session at sidebar:::", session);
    // console.log("imag eup date:::", session?.user?.imageUpdatedAt);
    // console.log("aaaa::", session?.user?.imageUpdatedAt);
    const url_image = session?.user?.image
        ? generateImageUrl(session?.user?.image, session?.user?.imageUpdatedAt)
        : "/avatar_default.jpg";

    return (
        <>
            <Modal.Open opens="sidebar">
                <button className="w-7 h-7">
                    {session?.user ? (
                        <Image
                            src={url_image}
                            width={28}
                            height={28}
                            sizes="100px"
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
                className="w-full h-screen"
            >
                <ModalSideBar user={session?.user} />
            </Modal.Window>
        </>
    );
}

export default SideBarHeader;

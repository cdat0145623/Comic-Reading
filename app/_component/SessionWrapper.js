"use client";
import { SessionProvider } from "next-auth/react";
import Modal from "./Modal/Modal";
import ModalWrapperAuth from "./Modal/ModalWrapperAuth";
import { GlobalToaster } from "./GlobalToaster";

function SessionWrapper({ session, children }) {
    return (
        <SessionProvider session={session}>
            <GlobalToaster />
            <Modal>
                {children}
                <ModalWrapperAuth />
            </Modal>
        </SessionProvider>
    );
}

export default SessionWrapper;

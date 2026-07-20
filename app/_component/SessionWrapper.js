"use client";
import { SessionProvider } from "next-auth/react";
import Modal from "./Modal/Modal";
import ModalWrapperAuth from "./Modal/ModalWrapperAuth";
import { GlobalToaster } from "./GlobalToaster";
import StoryActivityCrossTabSync from "./Story/Activity/StoryActivityCrossTabSync";
import ReadingCrossTabSync from "./Story/Chapter/ReadingCrossTabSync";
import AppearanceProvider from "./Appearance/AppearanceProvider";
import AuthSessionSync from "./Auth/AuthSessionSync";

function SessionWrapper({ session, children }) {
    return (
        <SessionProvider session={session} refetchOnWindowFocus={false}>
            <AppearanceProvider>
                <GlobalToaster />
                <AuthSessionSync />
                <StoryActivityCrossTabSync />
                <ReadingCrossTabSync />
                <Modal>
                    {children}
                    <ModalWrapperAuth />
                </Modal>
            </AppearanceProvider>
        </SessionProvider>
    );
}

export default SessionWrapper;

"use client";
import Modal from "./Modal";
import ModalSignIn from "./ModalSignIn";
import ModalSignUp from "./ModalSignUp";

function ModalWrapperAuth() {
    return (
        <>
            <Modal.Window
                name="signIn"
                variant="fade-center"
                className="m-auto"
            >
                <ModalSignIn />
            </Modal.Window>

            <Modal.Window
                name="signUp"
                variant="fade-center"
                className="m-auto"
            >
                <ModalSignUp />
            </Modal.Window>
        </>
    );
}

export default ModalWrapperAuth;

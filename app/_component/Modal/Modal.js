"use client";

import {
    cloneElement,
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";
import useOutsideClick from "../../hooks/useOutsideClick";
import { createPortal } from "react-dom";
import { useEscapseKey } from "@/app/hooks/useEscapeKey";

const ModalContext = createContext();
function Modal({ children }) {
    const [openName, setOpenName] = useState("");

    const close = () => setOpenName("");
    const open = (name) => setOpenName(name);
    return (
        <ModalContext.Provider value={{ open, close, openName }}>
            {children}
        </ModalContext.Provider>
    );
}

function Open({ children, opens: openWindowName }) {
    const { open } = useModal();

    return cloneElement(children, { onClick: () => open(openWindowName) });
}

function Window({ children, name, variant = "fade-center", className = "" }) {
    // console.log("variant", variant);
    const { openName, close } = useModal();

    const isOpen = name === openName;

    const ref = useOutsideClick(close, isOpen);
    useEscapseKey(close, isOpen);

    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => setIsMounted(true), []);
    if (!isMounted) return null;

    const variantClasses = {
        "slide-right": isOpen
            ? "translate-x-0 pointer-events-auto"
            : "translate-x-full pointer-events-none",
        "fade-center": isOpen
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-95 pointer-events-none",
    };

    const transitionBase =
        variant === "fade-center"
            ? "transition-all duration-500 ease-out"
            : "transform transition-transform duration-500 ease-in-out";

    return createPortal(
        <div className="fixed inset-0 z-10 pointer-events-none">
            <div
                className={`absolute w-full h-full bg-gray-500 transition-opacity duration-300 ${
                    isOpen ? "opacity-50" : "opacity-0"
                }`}
            ></div>
            <div
                className={`absolute flex max-w-full overflow-y-auto ${
                    variant === "fade-center"
                        ? "inset-0"
                        : "right-0 inset-y-0 pl-10 "
                } `}
            >
                <div
                    className={`${transitionBase} ${variantClasses[variant]} ${className} relative max-w-md`}
                    ref={ref}
                >
                    {cloneElement(children, { onCloseModal: close })}
                </div>
            </div>
        </div>,
        document.body
    );
}

export function useModal() {
    return useContext(ModalContext);
}

Modal.Open = Open;
Modal.Window = Window;

export default Modal;

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
    const [payload, setPayload] = useState(null);

    const close = () => {
        setOpenName("");
        setPayload(null);
    };
    const open = (name, data = null) => {
        setOpenName(name);
        setPayload(data);
    };
    return (
        <ModalContext.Provider value={{ open, close, payload, openName }}>
            {children}
        </ModalContext.Provider>
    );
}

function Open({ children, opens: openWindowName, callbackUrl }) {
    const { open } = useModal();

    return cloneElement(children, {
        onClick: () => open(openWindowName, { callbackUrl }),
    });
}

function Window({ children, name, variant = "fade-center", className = "" }) {
    const { openName, close } = useModal();

    const isOpen = name === openName;
    const isSlideRight = variant === "slide-right";

    const ref = useOutsideClick(close, isOpen);
    useEscapseKey(close, isOpen);

    const [isMounted, setIsMounted] = useState(false);
    const [shouldRenderSlide, setShouldRenderSlide] = useState(false);
    const [isSlideVisible, setIsSlideVisible] = useState(false);

    useEffect(() => setIsMounted(true), []);
    useEffect(() => {
        if (!isSlideRight) return;

        if (!isOpen) {
            setIsSlideVisible(false);
            return;
        }

        setShouldRenderSlide(true);
    }, [isOpen, isSlideRight]);

    useEffect(() => {
        if (!isSlideRight || !isOpen || !shouldRenderSlide) return;

        const animationFrame = requestAnimationFrame(() => {
            setIsSlideVisible(true);
        });

        return () => cancelAnimationFrame(animationFrame);
    }, [isOpen, isSlideRight, shouldRenderSlide]);

    if (!isMounted) return null;
    if (isSlideRight && !shouldRenderSlide) return null;

    const variantClasses = {
        "slide-right": `${
            isSlideVisible ? "translate-x-0" : "translate-x-full"
        } ${
            isOpen && isSlideVisible
                ? "pointer-events-auto"
                : "pointer-events-none"
        }`,
        "fade-center": isOpen
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-95 pointer-events-none",
    };

    const transitionBase =
        variant === "fade-center"
            ? "transition-all duration-500 ease-out"
            : "transform transition-transform duration-500 ease-in-out";
    const maxWidthClass = variant === "fade-center" ? "max-w-md" : "";
    const positionClass =
        variant === "fade-center"
            ? "inset-0"
            : "right-0 inset-y-0 w-full max-w-md";
    const overlayVisible = isSlideRight ? isSlideVisible : isOpen;

    return createPortal(
        <div className="fixed inset-0 z-50 pointer-events-none">
            <div
                className={`absolute w-full h-full bg-gray-500 transition-opacity ${
                    isSlideRight ? "duration-500" : "duration-300"
                } ${
                    overlayVisible ? "opacity-50" : "opacity-0"
                }`}
            ></div>
            <div
                className={`absolute flex overflow-x-hidden ${
                    isSlideRight
                        ? "overflow-hidden"
                        : isOpen
                          ? "overflow-y-auto"
                          : "overflow-hidden"
                } ${positionClass}`}
            >
                <div
                    className={`${transitionBase} ${variantClasses[variant]} ${className} ${maxWidthClass} relative`}
                    ref={ref}
                    aria-hidden={isSlideRight && !isOpen ? true : undefined}
                    inert={isSlideRight && !isOpen ? true : undefined}
                    onTransitionEnd={(event) => {
                        if (
                            isSlideRight &&
                            event.target === event.currentTarget &&
                            !isOpen
                        ) {
                            setShouldRenderSlide(false);
                        }
                    }}
                >
                    {cloneElement(children, { onCloseModal: close })}
                </div>
            </div>
        </div>,
        document.body,
    );
}

export function useModal() {
    return useContext(ModalContext);
}

Modal.Open = Open;
Modal.Window = Window;

export default Modal;

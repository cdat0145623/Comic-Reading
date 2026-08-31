"use client";
import Modal from "./Modal";
import Image from "next/image";

import { signUp } from "@/app/_lib/api";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { useForm } from "react-hook-form";
import { AppError } from "@/app/_lib/errors";
import { notify } from "@/lib/toaster";
import { handleLoginWithToast } from "@/lib/handleLoginWithToast";

function ModalSignUp({ onCloseModal }) {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        watch,
    } = useForm();

    const onSignUp = async (data) => {
        try {
            const { email, password } = data;

            const newUser = await signUp(email, password);

            if (newUser) {
                notify({
                    type: "success",
                    message: "Bạn đã tạo thành công tài khoản mới",
                    duration: 1000,
                });
                onCloseModal();
                setTimeout(async () => {
                    await handleLoginWithToast({
                        email: newUser.email,
                        password,
                    });
                }, 1500);
            }
        } catch (err) {
            if (err instanceof AppError) {
                console.error("Error at ModalSignUp:::", err?.message);
                notify({ type: "error", message: err.message });
            } else {
                console.error(err);
            }
        }
    };

    return (
        <>
            <form
                className="p-6 rounded-md w-full bg-secondary flex flex-col"
                onSubmit={handleSubmit(onSignUp)}
            >
                {/* Header */}
                <div className="flex items-center justify-between">
                    <Image
                        src="/logo.png"
                        alt="title"
                        className="w-8 h-8"
                        width={32}
                        height={32}
                    />
                    <h2 className="font-bold text-xl">Đăng ký</h2>
                    <button
                        type="button"
                        className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        onClick={onCloseModal}
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                {/* Body */}
                <div className="space-y-6 mt-10 mx-2">
                    <div className="flex flex-wrap items-center space-y-2">
                        <div className="w-full text-left">
                            <label htmlFor="email">Email</label>
                        </div>
                        <div className="w-full">
                            <input
                                id="email"
                                type="email"
                                placeholder="email"
                                className="w-full rounded-xl pl-5 pr-10 placeholder-gray-500 border border-gray-300 bg-slate-100 focus:outline-none focus:ring-1 focus:ring-primary h-10 text-sm"
                                {...register("email", {
                                    required: "Email không được để trống.",
                                    pattern: {
                                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                        message: "Email Không hợp lệ.",
                                    },
                                })}
                            />
                            {errors.email && (
                                <p className="text-red-500 mt-2">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center space-y-2">
                        <div className="w-full flex items-center">
                            <span>Mật khẩu</span>
                        </div>
                        <div className="w-full">
                            <input
                                type="password"
                                placeholder="password"
                                className="w-full rounded-xl pl-5 pr-10 placeholder-gray-500 border border-gray-300 bg-slate-100 focus:outline-none focus:ring-1 focus:ring-primary h-10 text-sm"
                                {...register("password", {
                                    required: "Bạn chưa nhập mật khẩu",
                                    minLength: {
                                        value: 6,
                                        message:
                                            "Mật khẩu phải có ít nhất 6 ký tự.",
                                    },
                                    validate: {
                                        hasUppercase: (value) =>
                                            /[A-Z]/.test(value) ||
                                            "Mật khẩu phải có ít nhất 1 ký tự in hoa.",
                                        hasNumber: (value) =>
                                            /\d/.test(value) ||
                                            "Mật khẩu phải có ít nhất 1 số.",
                                    },
                                })}
                            />
                            {errors.password && (
                                <>
                                    <p className="text-red-500 mt-2">
                                        {errors.password.message}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center space-y-2">
                        <div className="w-full flex items-center">
                            <span>Nhập lại mật khẩu</span>
                        </div>
                        <div className="w-full">
                            <input
                                type="password"
                                placeholder="password"
                                className="w-full rounded-xl pl-5 pr-10 placeholder-gray-500 border border-gray-300 bg-slate-100 focus:outline-none focus:ring-1 focus:ring-primary h-10 text-sm"
                                {...register("confirmPassword", {
                                    required: "Bạn chưa nhập lại mật khẩu.",
                                    validate: (value) =>
                                        value === watch("password") ||
                                        "Mật khẩu không khớp.",
                                })}
                            />
                            {errors.confirmPassword && (
                                <p className="text-red-500 mt-2">
                                    {errors.confirmPassword.message}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex justify-center w-full flex-wrap space-y-3">
                        <button
                            disabled={isSubmitting}
                            className="w-1/2 rounded-xl text-xl bg-primary disabled:opacity-25 text-white py-2"
                        >
                            {isSubmitting ? "Đang tạo..." : "Đăng ký"}
                        </button>
                        <div className="text-sm italic">
                            Đã có tài khoản?
                            <>
                                <Modal.Open opens="signIn">
                                    <button
                                        type="button"
                                        className="text-primary"
                                    >
                                        &nbsp;Đăng nhập đi
                                    </button>
                                </Modal.Open>
                            </>
                        </div>
                    </div>
                </div>
            </form>
        </>
    );
}

export default ModalSignUp;

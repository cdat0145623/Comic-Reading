"use client";
import Image from "next/image";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useForm } from "react-hook-form";
import Modal from "./Modal";
import { handleLoginWithToast } from "@/lib/handleLoginWithToast";
import SpinnerMini from "../SpinnerMini";

function ModalSignIn({ onCloseModal }) {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        watch,
    } = useForm();

    const onSignIn = async (data) => {
        console.log("OnSignIn data:", data);
        const loginData = await handleLoginWithToast(data);
        if (loginData.success) onCloseModal();
    };

    return (
        <>
            <form
                className="p-6 rounded-md w-full bg-secondary flex flex-col"
                onSubmit={handleSubmit(onSignIn)}
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
                    <h2 className="font-bold text-xl">Đăng nhập</h2>
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
                            <span>Email</span>
                        </div>
                        <div className="w-full">
                            <input
                                type="text"
                                placeholder="email"
                                className="w-full rounded-xl pl-5 pr-10 placeholder-gray-500 border border-gray-300 bg-slate-100 focus:outline-none focus:ring-1 focus:ring-primary h-10 text-sm"
                                {...register("email", {
                                    required: "Email không được để trống.",
                                    pattern: {
                                        value: /^[^s@]+@[^s@]+.[^s@]+$/,
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
                        <div className="w-full flex justify-between items-center">
                            <span>Mật khẩu</span>
                            <a className="text-primary">Quên mật khẩu?</a>
                        </div>
                        <div className="w-full">
                            <input
                                type="password"
                                placeholder="password"
                                className="w-full rounded-xl pl-5 pr-10 placeholder-gray-500 border border-gray-300 bg-slate-100 focus:outline-none focus:ring-1 focus:ring-primary h-10 text-sm"
                                {...register("password", {
                                    required: "Bạn chưa nhập mật khẩu",
                                    minLength: {
                                        value: 5,
                                        message:
                                            "Mật khẩu phải có ít nhất 5 ký tự.",
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
                    <div className="flex justify-center w-full flex-wrap space-y-3">
                        <button
                            className="w-1/2 rounded-xl text-xl bg-primary disabled:opacity-25 text-white py-2 "
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <div className="flex py-1">
                                    <span className="mx-auto">
                                        <SpinnerMini />
                                    </span>
                                </div>
                            ) : (
                                "Đăng nhập"
                            )}
                        </button>
                        <div className="text-sm italic">
                            Chưa có tài khoản?
                            <>
                                <Modal.Open opens="signUp">
                                    <button
                                        type="button"
                                        className="text-primary"
                                    >
                                        &nbsp;Đăng ký ngay
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

export default ModalSignIn;

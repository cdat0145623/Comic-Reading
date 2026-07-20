"use client";

import { signIn, signOut } from "next-auth/react";
import { XCircleIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { notify } from "./toaster";

const loginUser = async (data, callbackUrl) => {
    const { email, password } = data;
    const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
        ...(callbackUrl && { redirectTo: callbackUrl }),
    });
    // await new Promise((res) => setTimeout(res, 5000));

    if (!res.error && !res.code) {
        return {
            success: true,
            message: "Đăng nhập thành công",
            url: res.url || callbackUrl || "/",
        };
    } else {
        throw new Error("Email hoặc mật khẩu không đúng");
    }
};

export const handleLoginWithToast = async (data, payload) => {
    const loginPromise = loginUser(data, payload);

    toast.promise(loginPromise, {
        loading: "Đang đăng nhập",
        success: (res) => {
            // setTimeout(() => {
            //     window.location.reload();
            // }, 2000);

            return {
                message: res.message,
                duration: 1000,
                action: {
                    label: <XCircleIcon className="w-6 h-6 text-success" />,
                    onClick: () => toast.dismiss(),
                },
            };
        },
        error: (err) => {
            return err.message || "Đăng nhập thất bại";
        },
    });

    return await loginPromise;
};

export const handleLogoutWithToast = async ({ pathname }) => {
    console.log("pathname::", pathname);
    if (pathname === "/") await signOut({ redirect: false });
    else await signOut({ redirect: true });
    // await signOut({ callbackUrl: "/" });

    notify({
        type: "success",
        message: "Đăng xuất thành công",
    });

    // setTimeout(() => {
    //     window.location.href = "/";
    // }, 2500);
};

// return {
//                 message: err.message || "Đăng nhập thất bại",
//                 className: "custom-toast-error",
//                 duration: 1000000000,
//                 action: {
//                     label: <XCircleIcon className="w-6 h-6 text-error" />,
//                     onClick: () => toast.dismiss(),
//                 },
//             };

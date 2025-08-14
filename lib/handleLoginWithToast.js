"use client";

import { signIn, signOut } from "next-auth/react";
import { XCircleIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";

const loginUser = async (data) => {
    const { email, password } = data;
    const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
    });
    // await new Promise((res) => setTimeout(res, 5000));

    if (!res.error && !res.code) {
        return {
            success: true,
            message: "Đăng nhập thành công",
        };
    } else {
        throw new Error(res?.code || "Đăng nhập thất bại");
    }
};

export const handleLoginWithToast = async (data) => {
    const loginPromise = loginUser(data);

    toast.promise(loginPromise, {
        loading: "Đang đăng nhập",
        success: (res) => {
            setTimeout(() => {
                window.location.reload();
            }, 2000);
            return res.message;
        },
        error: (err) => {
            console.log("handleLoginWithToast::", err);
            return err.message || "Đăng nhập thất bại";
        },
    });

    return await loginPromise;
};

export const handleLogoutWithToast = async () => {
    await signOut({ redirect: false });

    toast.success("Đăng xuất thành công");

    setTimeout(() => {
        window.location.href = "/";
    }, 2500);
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

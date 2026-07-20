"use client";

import {
    EnvelopeIcon,
    KeyIcon,
    ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import FormField from "@/app/_component/Form/FormField";
import FormStatus from "@/app/_component/Form/FormStatus";
import FormSubmitButton from "@/app/_component/Form/FormSubmitButton";
import PasswordField from "@/app/_component/Form/PasswordField";
import {
    ChangeEmailSchema,
    ChangePasswordSchema,
} from "@/app/_lib/validate";
import { zodResolver } from "@hookform/resolvers/zod";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import styles from "./security.module.css";
import { publishAuthInvalidation } from "@/app/_lib/auth-session-sync";

async function requestJson(url, options) {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok)
        throw new Error(data.error || "Không thể thực hiện yêu cầu");
    return data;
}

export default function SecuritySettings({
    account,
    pendingEmail,
    onPendingEmailChange,
    focusEmailForm,
    onEmailFocused,
}) {
    const router = useRouter();
    const [emailState, setEmailState] = useState({ type: "", message: "" });
    const [passwordState, setPasswordState] = useState({
        type: "",
        message: "",
    });
    const [emailActionPending, setEmailActionPending] = useState(false);
    const {
        register: registerEmail,
        handleSubmit: handleEmailSubmit,
        reset: resetEmail,
        setError: setEmailError,
        clearErrors: clearEmailErrors,
        setFocus: setEmailFocus,
        formState: {
            errors: emailErrors,
            isSubmitting: isEmailSubmitting,
        },
    } = useForm({
        resolver: zodResolver(ChangeEmailSchema),
        defaultValues: { email: "", currentPassword: "" },
    });
    const {
        register: registerPassword,
        handleSubmit: handlePasswordSubmit,
        reset: resetPassword,
        setError: setPasswordError,
        clearErrors: clearPasswordErrors,
        formState: { errors: passwordErrors, isSubmitting: passwordPending },
    } = useForm({
        resolver: zodResolver(ChangePasswordSchema),
        defaultValues: {
            currentPassword: "",
            password: "",
            confirmPassword: "",
        },
    });
    const emailPending = isEmailSubmitting || emailActionPending;

    useEffect(() => {
        if (!focusEmailForm) return;
        document.getElementById("security-email")?.scrollIntoView({
            behavior: "smooth",
            block: "center",
        });
        setEmailFocus("email", { shouldSelect: false });
        onEmailFocused();
    }, [focusEmailForm, onEmailFocused, setEmailFocus]);

    async function submitEmail(values) {
        setEmailState({ type: "", message: "" });
        clearEmailErrors("root.server");
        try {
            const data = await requestJson("/api/auth/email/change/request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });
            onPendingEmailChange(data.email);
            resetEmail();
            setEmailState({ type: "success", message: data.message });
            router.refresh();
        } catch (error) {
            setEmailError("root.server", {
                type: "server",
                message: error.message,
            });
        }
    }

    async function resendEmail() {
        setEmailActionPending(true);
        setEmailState({ type: "", message: "" });
        clearEmailErrors("root.server");
        try {
            const data = await requestJson("/api/auth/email/change/resend", {
                method: "POST",
            });
            setEmailState({ type: "success", message: data.message });
            router.refresh();
        } catch (error) {
            setEmailError("root.server", {
                type: "server",
                message: error.message,
            });
        } finally {
            setEmailActionPending(false);
        }
    }

    async function cancelEmail() {
        setEmailActionPending(true);
        setEmailState({ type: "", message: "" });
        clearEmailErrors("root.server");
        try {
            const data = await requestJson("/api/auth/email/change/cancel", {
                method: "DELETE",
            });
            onPendingEmailChange(null);
            setEmailState({ type: "success", message: data.message });
            router.refresh();
        } catch (error) {
            setEmailError("root.server", {
                type: "server",
                message: error.message,
            });
        } finally {
            setEmailActionPending(false);
        }
    }

    async function submitPassword(values) {
        setPasswordState({ type: "", message: "" });
        clearPasswordErrors("root.server");
        try {
            const data = await requestJson("/api/auth/password/change", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });
            setPasswordState({
                type: "success",
                message:
                    "Đã đổi mật khẩu. Bạn sẽ được chuyển tới trang đăng nhập.",
            });
            resetPassword();
            publishAuthInvalidation(data.reason || "password-changed");
            try {
                await signOut({ redirectTo: "/login?passwordChanged=1" });
            } catch {
                window.location.assign("/login?passwordChanged=1");
            }
        } catch (error) {
            setPasswordError("root.server", {
                type: "server",
                message: error.message,
            });
        }
    }

    const emailStatus = emailErrors.root?.server?.message
        ? { type: "error", message: emailErrors.root.server.message }
        : emailState;
    const passwordStatus = passwordErrors.root?.server?.message
        ? { type: "error", message: passwordErrors.root.server.message }
        : passwordState;

    return (
        <div className={styles.securityEnter}>
            <header className="app-border border-b px-5 py-5 sm:px-7">
                <div className="flex items-center gap-3">
                    <ShieldCheckIcon className="h-6 w-6 text-primary" />
                    <div>
                        <h1 className="text-xl font-semibold">Bảo mật</h1>
                        <p className="app-muted mt-1 text-sm">
                            Quản lý email đăng nhập và mật khẩu của tài khoản.
                        </p>
                    </div>
                </div>
            </header>

            <section
                className="app-border border-b px-5 py-7 sm:px-7"
                aria-labelledby="change-email-title"
            >
                <div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                    <div>
                        <EnvelopeIcon className="h-6 w-6 text-primary" />
                        <h2
                            id="change-email-title"
                            className="mt-3 text-lg font-semibold"
                        >
                            Đổi email
                        </h2>
                        <p className="app-muted mt-2 max-w-sm text-sm leading-6">
                            Email hiện tại vẫn dùng được cho tới khi bạn xác
                            nhận địa chỉ mới.
                        </p>
                        <p className="mt-4 text-sm font-medium">
                            Email hiện tại
                        </p>
                        <p className="app-muted mt-1 break-all text-sm">
                            {account.email}
                        </p>
                    </div>

                    <div>
                        {pendingEmail && (
                            <div className="app-border mb-6 border-l-4 border-l-primary bg-[var(--app-primary-soft)] p-4">
                                <p className="text-sm font-semibold">
                                    Đang chờ xác nhận
                                </p>
                                <p className="app-muted mt-1 break-all text-sm">
                                    {pendingEmail}
                                </p>
                                <div className="mt-3 flex flex-wrap gap-3">
                                    <button
                                        type="button"
                                        onClick={resendEmail}
                                        disabled={emailPending}
                                        className="text-sm font-semibold text-primary disabled:opacity-50"
                                    >
                                        Gửi lại
                                    </button>
                                    <button
                                        type="button"
                                        onClick={cancelEmail}
                                        disabled={emailPending}
                                        className="text-sm font-semibold text-red-600 disabled:opacity-50"
                                    >
                                        Hủy yêu cầu
                                    </button>
                                </div>
                            </div>
                        )}

                        {account.hasPassword ? (
                            <form
                                onSubmit={handleEmailSubmit(submitEmail, () =>
                                    setEmailState({ type: "", message: "" }),
                                )}
                                className="space-y-4"
                                noValidate
                            >
                                <FormField
                                    id="security-email"
                                    label="Email mới"
                                    type="email"
                                    registration={registerEmail("email")}
                                    error={emailErrors.email?.message}
                                    disabled={emailPending}
                                />
                                <PasswordField
                                    id="security-email-password"
                                    label="Mật khẩu hiện tại"
                                    registration={registerEmail(
                                        "currentPassword",
                                    )}
                                    error={
                                        emailErrors.currentPassword?.message
                                    }
                                    disabled={emailPending}
                                />
                                <FormSubmitButton
                                    isPending={emailPending}
                                    pendingLabel="Đang gửi liên kết xác nhận"
                                >
                                    Gửi liên kết xác nhận
                                </FormSubmitButton>
                            </form>
                        ) : (
                            <div className="app-border border p-4 text-sm">
                                Tài khoản đang dùng Google và chưa có mật khẩu.
                                Flow đổi email cho tài khoản Google-only sẽ được
                                bổ sung ở phase sau.
                            </div>
                        )}
                        <FormStatus state={emailStatus} />
                    </div>
                </div>
            </section>

            <section
                className="px-5 py-7 sm:px-7"
                aria-labelledby="change-password-title"
            >
                <div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                    <div>
                        <KeyIcon className="h-6 w-6 text-primary" />
                        <h2
                            id="change-password-title"
                            className="mt-3 text-lg font-semibold"
                        >
                            Đổi mật khẩu
                        </h2>
                        <p className="app-muted mt-2 max-w-sm text-sm leading-6">
                            Dùng ít nhất 8 ký tự, gồm một chữ in hoa và một chữ
                            số.
                        </p>
                    </div>
                    <div>
                        {account.hasPassword ? (
                            <form
                                onSubmit={handlePasswordSubmit(
                                    submitPassword,
                                    () =>
                                        setPasswordState({
                                            type: "",
                                            message: "",
                                        }),
                                )}
                                className="space-y-4"
                                noValidate
                            >
                                <PasswordField
                                    id="current-password"
                                    label="Mật khẩu hiện tại"
                                    registration={registerPassword(
                                        "currentPassword",
                                    )}
                                    error={
                                        passwordErrors.currentPassword?.message
                                    }
                                    autoComplete="current-password"
                                    disabled={passwordPending}
                                />
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <PasswordField
                                        id="new-password"
                                        label="Mật khẩu mới"
                                        registration={registerPassword(
                                            "password",
                                        )}
                                        error={passwordErrors.password?.message}
                                        autoComplete="new-password"
                                        disabled={passwordPending}
                                    />
                                    <PasswordField
                                        id="confirm-password"
                                        label="Xác nhận mật khẩu"
                                        registration={registerPassword(
                                            "confirmPassword",
                                        )}
                                        error={
                                            passwordErrors.confirmPassword
                                                ?.message
                                        }
                                        autoComplete="new-password"
                                        disabled={passwordPending}
                                    />
                                </div>
                                <FormSubmitButton
                                    isPending={passwordPending}
                                    pendingLabel="Đang cập nhật mật khẩu"
                                >
                                    Cập nhật mật khẩu
                                </FormSubmitButton>
                            </form>
                        ) : (
                            <div className="app-border border p-4 text-sm">
                                Tài khoản này đăng nhập bằng Google. Chức năng
                                tạo mật khẩu sẽ được triển khai cùng flow xác
                                thực lại Google.
                            </div>
                        )}
                        <FormStatus state={passwordStatus} />
                    </div>
                </div>
            </section>
        </div>
    );
}

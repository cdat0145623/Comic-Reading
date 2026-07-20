import ForgotPasswordForm from "@/app/_component/Auth/ForgotPasswordForm";
import AuthPageShell from "@/app/_component/Auth/AuthPageShell";

export default function Page() {
    return (
        <AuthPageShell
            contextTitle="Khôi phục quyền truy cập"
            contextCopy="Chúng tôi sẽ gửi một liên kết dùng một lần tới email đăng ký của bạn."
        >
            <h1 className="text-3xl font-semibold">Quên mật khẩu</h1>
            <p className="app-muted mt-3 text-sm leading-6">
                Nhập email đã đăng ký để nhận liên kết đặt lại mật khẩu.
            </p>
            <div className="mt-7">
                <ForgotPasswordForm />
            </div>
        </AuthPageShell>
    );
}

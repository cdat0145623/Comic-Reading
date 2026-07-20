import ResetPasswordForm from "@/app/_component/Auth/ResetPasswordForm";
import AuthPageShell from "@/app/_component/Auth/AuthPageShell";

export default async function Page({ searchParams }) {
    const params = await searchParams;
    return (
        <AuthPageShell
            contextTitle="Tạo mật khẩu mới"
            contextCopy="Xác nhận thay đổi sẽ kết thúc các phiên đăng nhập cũ trên thiết bị khác."
        >
            <h1 className="text-3xl font-semibold">Đặt lại mật khẩu</h1>
            <p className="app-muted mt-3 text-sm leading-6">
                Dùng ít nhất 8 ký tự, gồm một chữ in hoa và một chữ số.
            </p>
            <div className="mt-7">
                <ResetPasswordForm token={params?.token || ""} />
            </div>
        </AuthPageShell>
    );
}

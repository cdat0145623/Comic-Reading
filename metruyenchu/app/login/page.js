import SignInButton from "../_component/SignInButton";
import CredentialsLoginForm from "../_component/Auth/CredentialsLoginForm";
import AuthPageShell from "../_component/Auth/AuthPageShell";
import AuthNoticeToast from "../_component/Auth/AuthNoticeToast";

async function Page({ searchParams }) {
    const params = await searchParams;
    const callbackUrl =
        params?.callbackUrl?.startsWith("/") &&
        !params.callbackUrl.startsWith("//")
        ? params.callbackUrl
        : "/";
    const notice = params?.emailChanged
        ? { type: "success", message: "Email đã được thay đổi. Hãy đăng nhập bằng email mới." }
        : params?.passwordChanged
          ? { type: "success", message: "Mật khẩu đã được thay đổi. Hãy đăng nhập lại." }
          : params?.sessionRevoked
            ? { type: "warning", message: "Phiên đăng nhập đã hết hiệu lực. Vui lòng đăng nhập lại." }
            : null;
    return (
        <AuthPageShell
            eyebrow="Tài khoản đọc truyện"
            contextTitle="Đăng nhập lại để tiếp tục"
            contextCopy="Tiếp tục đọc, lưu tiến độ và quản lý tủ truyện của bạn."
        >
            {notice && (
                <AuthNoticeToast type={notice.type} message={notice.message} />
            )}
            <h1 className="text-3xl font-semibold">Đăng nhập</h1>
            <p className="app-muted mt-3 text-sm">
                Sử dụng email và mật khẩu của tài khoản.
            </p>
            <div className="mt-6">
                <CredentialsLoginForm callbackUrl={callbackUrl} />
            </div>
            <div className="app-muted my-5 flex items-center gap-3 text-xs">
                <span className="app-border h-px flex-1 bg-[var(--app-border)]" />
                hoặc
                <span className="app-border h-px flex-1 bg-[var(--app-border)]" />
            </div>
            <SignInButton callbackUrl={callbackUrl} className="w-full" />
        </AuthPageShell>
    );
}

export default Page;

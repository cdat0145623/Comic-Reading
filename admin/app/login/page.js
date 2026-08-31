import Image from "next/image";
import { BookMarked, CheckCircle2, ShieldCheck } from "lucide-react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { hasAdminAccess } from "@mtc/auth/policy";

import { LoginForm } from "@/components/auth/login-form";
import { getAdminSession } from "@/lib/authorization";

const assurances = [
    "Phân quyền theo session và dữ liệu tài khoản",
    "Ghi audit log cho thao tác quản trị nhạy cảm",
    "Tách biệt hoàn toàn khỏi giao diện đọc truyện",
];

export default async function LoginPage() {
    const session = await getAdminSession();
    if (hasAdminAccess(session)) redirect("/dashboard");

    const cookieStore = await cookies();
    const flash = cookieStore.get("mtc-admin.flash")?.value;
    const forgotPasswordUrl = new URL(
        "/quen-mat-khau",
        process.env.READER_APP_URL || "http://localhost:3000",
    ).toString();

    return (
        <main className="grid min-h-[100dvh] lg:grid-cols-[minmax(0,1fr)_minmax(500px,0.72fr)]">
            <section className="relative hidden overflow-hidden bg-sidebar px-12 py-10 text-sidebar-foreground lg:flex lg:flex-col lg:justify-between xl:px-20 xl:py-14">
                <div className="absolute inset-y-0 right-0 w-px bg-white/10" />
                <div className="flex items-center gap-3">
                    <span className="flex size-12 items-center justify-center rounded-md border border-white/20 bg-white/5 p-1">
                        <Image
                            src="/logo.png"
                            width={40}
                            height={40}
                            alt="Mê Truyện Chữ"
                            priority
                        />
                    </span>
                    <span>
                        <strong className="block text-base">
                            Mê Truyện Chữ
                        </strong>
                        <span className="text-sm text-white/55">
                            Không gian vận hành
                        </span>
                    </span>
                </div>

                <div className="max-w-xl pb-12">
                    <div className="mb-8 flex size-14 items-center justify-center rounded-md border border-sidebar-accent/35 bg-sidebar-accent/10 text-sidebar-accent-strong">
                        <BookMarked size={27} />
                    </div>
                    <h1 className="max-w-lg text-4xl font-bold leading-tight xl:text-5xl">
                        Một nơi để vận hành nội dung, độc giả và doanh thu.
                    </h1>
                    <p className="mt-5 max-w-lg text-base leading-7 text-white/62">
                        Dashboard tập trung cho quản trị viên và người đăng
                        truyện, với dữ liệu được giới hạn đúng theo vai trò.
                    </p>

                    <div className="mt-10 space-y-4 border-t border-white/10 pt-7">
                        {assurances.map((item) => (
                            <div
                                className="flex items-center gap-3 text-sm text-white/72"
                                key={item}
                            >
                                <CheckCircle2
                                    className="text-sidebar-accent"
                                    size={17}
                                />
                                {item}
                            </div>
                        ))}
                    </div>
                </div>

                <p className="text-xs text-white/40">
                    MTC Operations Console · Internal access
                </p>
            </section>

            <section className="flex min-h-[100dvh] items-center justify-center bg-surface px-5 py-10 sm:px-10">
                <div className="w-full max-w-md animate-enter">
                    <div className="mb-9 flex items-center gap-3 lg:hidden">
                        <span className="flex size-10 items-center justify-center rounded-md bg-sidebar p-1">
                            <Image
                                src="/logo.png"
                                width={34}
                                height={34}
                                alt="Mê Truyện Chữ"
                                priority
                            />
                        </span>
                        <strong>Mê Truyện Chữ Admin</strong>
                    </div>

                    <div className="flex size-11 items-center justify-center rounded-md bg-accent-soft text-accent">
                        <ShieldCheck size={23} />
                    </div>
                    <h2 className="mt-5 text-3xl font-bold">
                        Đăng nhập quản trị
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-muted">
                        Dùng tài khoản đã được cấp quyền để tiếp tục.
                    </p>

                    {flash ? (
                        <p
                            className="mt-5 border-l-2 border-accent bg-accent-soft px-4 py-3 text-sm leading-6 text-foreground"
                            role="status"
                        >
                            {flash === "session-ended"
                                ? "Phiên quản trị đã hết hạn hoặc quyền tài khoản đã thay đổi. Vui lòng đăng nhập lại."
                                : "Vui lòng đăng nhập bằng tài khoản đã được cấp quyền."}
                        </p>
                    ) : null}

                    <LoginForm forgotPasswordUrl={forgotPasswordUrl} />
                </div>
            </section>
        </main>
    );
}

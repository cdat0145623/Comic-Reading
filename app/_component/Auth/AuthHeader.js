import Link from "next/link";
import Logo from "@/app/_component/Logo";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function AuthHeader() {
    return (
        <header className="app-panel app-border relative z-40 border-b">
            <div className="grid min-h-[72px] grid-cols-[1fr_auto_1fr] items-center px-4">
                <Link
                    href="/"
                    className="inline-flex h-10 w-10 items-center justify-center border border-transparent hover:border-[var(--app-border)]"
                    aria-label="Về trang chủ"
                    title="Về trang chủ"
                >
                    <ArrowLeftIcon className="h-5 w-5" />
                </Link>
                <Logo />
                <Link
                    href="/"
                    className="app-muted justify-self-end text-sm hover:text-primary"
                >
                    Trang chủ
                </Link>
            </div>
        </header>
    );
}

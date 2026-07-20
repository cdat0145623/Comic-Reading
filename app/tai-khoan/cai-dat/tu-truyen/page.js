import { redirect } from "next/navigation";

export const metadata = {
    title: "Cài đặt Tủ truyện",
};

export default function LibrarySettingsPage() {
    redirect("/tai-khoan/cai-dat");
}

import { redirect } from "next/navigation";

export default function LegacySelectedStoriesPage() {
    redirect("/kham-pha?attribute=chon-loc");
}

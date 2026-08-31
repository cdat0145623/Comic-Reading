import { redirect } from "next/navigation";

export default function LegacyNewStoriesPage() {
    redirect("/kham-pha?sort=updated");
}

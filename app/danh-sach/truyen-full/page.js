import { redirect } from "next/navigation";

export default function LegacyCompletedStoriesPage() {
    redirect("/kham-pha?status=hoan-thanh");
}

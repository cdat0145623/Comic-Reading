import EmailChangeResult from "@/app/_component/Auth/EmailChangeResult";

export default async function Page({ searchParams }) {
    const params = await searchParams;
    return <EmailChangeResult token={params?.token || ""} />;
}

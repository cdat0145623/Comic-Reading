import EmailVerificationResult from "@/app/_component/Auth/EmailVerificationResult";

export default async function Page({ searchParams }) {
    const params = await searchParams;
    return <EmailVerificationResult token={params?.token || ""} />;
}

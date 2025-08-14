import "@/app/_styles/globals.css";
import Header from "./_component/Header";
import Banner from "./_component/Banner";
import Footer from "./_component/Footer";
import SessionWrapper from "./_component/SessionWrapper";
import { auth } from "@/lib/auth-with-adapter";
import Providers from "./Providers";

export const metadata = {
    title: {
        template: "%s / Mê Truyện Chữ - MeTruyenChu - TruyenCv",
        default: "Mê Truyện Chữ - MeTruyenChu - TruyenCv",
    },
    description:
        "Luxuxious cabin hotel, located in the heart of Italian Dolomites, surrounded by beautiful mountains and dark forests",
};
export default async function RootLayout({ children }) {
    const session = await auth();
    // console.log("Root Sesssion::::", session);
    return (
        <html lang="en">
            <body className="min-h-screen">
                <Providers>
                    <SessionWrapper session={session}>
                        <Header />
                        <Banner />
                        <main className="mt-6 space-y-5">{children}</main>
                        <Footer />
                    </SessionWrapper>
                </Providers>
            </body>
        </html>
    );
}

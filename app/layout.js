import "@/app/_styles/globals.css";
import Header from "./_component/Header";
import Banner from "./_component/Banner";
import Footer from "./_component/Footer";
import SessionWrapper from "./_component/SessionWrapper";
import { auth } from "@/lib/auth";
import Providers from "./Providers";
import { NavigationProgressProvider } from "./_component/NavigationProgressBar";
import { getAppearanceBootstrapScript } from "./_lib/appearance";
import RouteChrome from "./_component/RouteChrome";
import AuthHeader from "./_component/Auth/AuthHeader";

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
        <html lang="vi" suppressHydrationWarning>
            <head>
                <script
                    dangerouslySetInnerHTML={{
                        __html: getAppearanceBootstrapScript(),
                    }}
                />
            </head>
            <body className="min-h-screen">
                <Providers>
                    <NavigationProgressProvider>
                        <SessionWrapper session={session}>
                            <RouteChrome
                                siteHeader={<Header />}
                                authHeader={<AuthHeader />}
                                banner={<Banner />}
                                footer={<Footer />}
                            >
                                {children}
                            </RouteChrome>
                        </SessionWrapper>
                    </NavigationProgressProvider>
                </Providers>
            </body>
        </html>
    );
}

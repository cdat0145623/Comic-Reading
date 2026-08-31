import "./globals.css";

export const metadata = {
    title: "MTC Admin",
    description: "Không gian vận hành Mê Truyện Chữ",
};

export default function RootLayout({ children }) {
    return (
        <html lang="vi">
            <body>{children}</body>
        </html>
    );
}

import Image from "next/image";
import Link from "next/link";

function Footer() {
    return (
        <footer className="app-surface mt-5 p-5 border-t border-slate-200 text-gray-500 text-sm text-center max-w-screen-lg mx-auto">
            <div className="text-center">
                <span>
                    Mê Truyện Chữ là nền tảng mở trực tuyến, miễn phí đọc truyện
                    chữ được đóng góp nội dung từ các tác giả viết truyện và các
                    dịch giả convert, dịch truyện, rất nhiều truyện hay và nổi
                    bật được cập nhật nhanh nhất với đủ các thể loại tiên hiệp,
                    kiếm hiệp, huyền ảo ...
                </span>
            </div>
            <Image
                src="/logo.png"
                alt=""
                className="mx-auto my-2"
                width={64}
                height={64}
            />

            <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-6 sm:justify-center sm:space-y-0">
                <Link href="#">Điều khoản dịch vụ</Link>
                <Link href="#">Chính sách bảo mật</Link>
                <Link href="#">Về bản quyền</Link>
                <Link href="#">Hướng dẫn sử dụng</Link>
            </div>
        </footer>
    );
}

export default Footer;

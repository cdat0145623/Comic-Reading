import Image from "next/image";
import { KeyIcon } from "@heroicons/react/20/solid";
import { TicketIcon } from "@heroicons/react/20/solid";

function Notice({ activeTab = "fans" }) {
    return (
        <>
            {activeTab === "fans" ? (
                <div className="mt-8 space-y-2 col-span-full">
                    <p className="text-sm">
                        · Khi bạn mở khóa, đề cử hay tặng quà cho truyện, bạn
                        trở thành người hâm mộ của truyện.
                    </p>
                    <div className="flex items-center text-sm">
                        · Tiêu xài 1 &nbsp;
                        <Image
                            src="/candy.png"
                            alt=""
                            className="w-3 h-3"
                            width={12}
                            height={12}
                        />
                        &nbsp; = 1 điểm hâm mộ (mở khóa, tặng quà)
                    </div>
                    <div className="flex items-center text-sm">
                        · Dùng &nbsp;
                        <KeyIcon className="w-4 h-4 text-primary" />
                        &nbsp; mở khóa được số điểm bằng số &nbsp;
                        <Image
                            src="/candy.png"
                            alt=""
                            className="w-3 h-3"
                            width={12}
                            height={12}
                        />
                        &nbsp; cần để mở khóa
                    </div>
                    <div className="flex items-center text-sm">
                        · Đề cử truyện bằng &nbsp;
                        <TicketIcon className="w-4 h-4 text-primary" />
                        &nbsp; = 1000 điểm hâm mộ
                    </div>
                </div>
            ) : (
                <div className="p-4 rounded space-y-2 bg-secondary text-sm">
                    <p>
                        - Từ phiên bản mới các bài đánh giá có nội dung sẽ được
                        các BTV duyệt đọc trước khi được hiển thị.
                    </p>
                    <p>
                        - Nếu bạn chỉ muốn chấm điểm cho truyện, không muốn viết
                        đánh giá, hãy tích vào
                        <span className="font-bold">
                            &nbsp;&quot;Tôi chỉ muốn chấm điểm&quot;&nbsp;.
                        </span>
                    </p>
                    <p>
                        - Vui lòng đọc kỹ
                        <a href="#" className="font-bold">
                            &nbsp;Điều khoản dịch vụ&nbsp;
                        </a>
                        và
                        <a href="#" className="font-bold">
                            &nbsp;Hướng dẫn sử dụng&nbsp;
                        </a>
                        trước khi viết đánh giá.
                    </p>
                    <p>
                        - Các đánh giá trước ở phiên bản cũ có nội dung quá ngắn
                        và không có tương tác mặc định sẽ không được hiển thị,
                        bạn có thể xem nó bằng cách tích vào
                        <span className="font-bold">
                            &nbsp;&quot;Hiện tất cả đánh giá&quot;&nbsp;.
                        </span>
                    </p>
                </div>
            )}
        </>
    );
}

export default Notice;

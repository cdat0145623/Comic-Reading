import { PrismaClient } from "../app/generated/prisma/index.js";
import slugify from "slugify";
import { LoremIpsum } from "lorem-ipsum";

const prisma = new PrismaClient({ log: ["query", "info"] });

const lorem = new LoremIpsum({
    wordsPerSentence: { min: 3, max: 10 },
    sentencesPerParagraph: { min: 3, max: 6 },
});
function generateRandomContent(wordCount = 500) {
    return lorem.generateWords(wordCount);
}

const userData = [
    {
        name: "FsQSbfeHsu",
        email: "user2@prisma.io",
        password: "Kinbiut123",
        avatarUrl: "https://static.cdnno.com/user/default/200.jpg",
        birthYear: 2005,
        setting: {
            create: {},
        },
    },
    {
        name: "NkLbT31750",
        email: "jung@gmail.com",
        password: "Kinbiut123",
        avatarUrl: "https://static.cdnno.com/user/default/200.jpg",
        birthYear: 2004,
        setting: {
            create: {},
        },
    },
];

/* - Test 1: handle Slug and connect userId 1 */
// const storyData = [
//     {
//         title: "Ta Ở Huyền Vũ Trên Lưng Xây Gia Viên",
//         slug: slugify("Ta Ở Huyền Vũ Trên Lưng Xây Gia Viên", {
//             lower: true,
//             strict: true,
//         }),
//         stringUrl:
//             "https://static.cdnno.com/storage/topbox/3dd51fe6c15c01fe2ce83d704df77b28.webp",
//         totalChapters: 100,
//         uploader: {
//             connect: {
//                 id: 1,
//             },
//         },
//         author: {
//             create: {
//                 name: "Tac gia 1",
//             },
//         },
//     },
//     {
//         title: "Ta Mở Thật Sự Là Cô Nhi Viện, Không Phải Sát Thủ Đường",
//         slug: slugify(
//             "Ta Mở Thật Sự Là Cô Nhi Viện, Không Phải Sát Thủ Đường",
//             { lower: true, strict: true }
//         ),
//         stringUrl:
//             "https://static.cdnno.com/poster/ta-mo-that-su-la-co-nhi-vien-khong-phai-sat-thu-duong/300.jpg?1714982331",
//         totalChapters: 300,
//         uploader: {
//             connect: {
//                 id: 1,
//             },
//         },
//         author: {
//             create: {
//                 name: "Tac gia 2",
//             },
//         },
//     },
// ];

/* - Test 2: random chapters and random content in chapter  */
// const storyData = [
//     {
//         title: "Nô Lệ Bóng Tối 3",
//         stringUrl:
//             "https://static.cdnno.com/poster/no-le-bong-toi/300.jpg?1731995470",
//         totalChapters: 2,
//         uploader: {
//             connect: {
//                 id: 1,
//             },
//         },
//         author: {
//             connect: {
//                 id: 7,
//             },
//         },
//     },
//     {
//         title: "Tỏ Tình Giáo Hoa, Hệ Thống Ban Thưởng Trái Chấn Động 2",
//         stringUrl:
//             "https://static.cdnno.com/poster/to-tinh-giao-hoa-he-thong-ban-thuong-trai-chan-dong/300.jpg?1747083884",
//         totalChapters: 3,
//         uploader: {
//             connect: {
//                 id: 3,
//             },
//         },
//         author: {
//             connect: {
//                 id: 8,
//             },
//         },
//     },
// ];

const storyData = [
    {
        title: "Hảo Hữu Tử Vong: Ta Tu Vi Lại Tăng Lên 6",
        stringUrl:
            "https://static.cdnno.com/poster/hao-huu-tu-vong-ta-tu-vi-lai-tang-len/300.jpg?1642214772",
        totalChapters: 20,
        uploader: {
            connect: {
                id: 13,
            },
        },
        author: {
            connect: {
                id: 3,
            },
        },
    },
    {
        title: "Tu Luyện Giản Lược Hóa Công Pháp Bắt Đầu 6",
        stringUrl:
            "https://static.cdnno.com/poster/tu-luyen-gian-luoc-hoa-cong-phap-bat-dau/300.jpg?1719733771",
        totalChapters: 20,
        uploader: {
            connect: {
                id: 13,
            },
        },
        author: {
            connect: {
                id: 4,
            },
        },
    },
    {
        title: "Vạn Pháp Đạo Quân, Từ Tiểu Vân Vũ Thuật Bắt Đầu 6",
        stringUrl:
            "https://static.cdnno.com/poster/van-phap-dao-quan-tu-tieu-van-vu-thuat-bat-dau/300.jpg?1745485241",
        totalChapters: 10,
        uploader: {
            connect: {
                id: 13,
            },
        },
        author: {
            connect: {
                id: 5,
            },
        },
    },
];

export async function main() {
    const uploadedUserIds = new Set();
    for (const story of storyData) {
        const uploaderId = story.uploader.connect.id;

        const chapters = Array.from(
            { length: story.totalChapters },
            (_, i) => ({
                name: `Chương ${i + 1}`,
                number: i + 1,
                content: generateRandomContent(500),
            })
        );
        const data = {
            title: story.title,
            stringUrl: story.stringUrl,
            totalChapters: story.totalChapters,
            slug: slugify(story.title, { lower: true, strict: true }),
            uploader: story.uploader,
            author: story.author,
            chapters: {
                create: chapters,
            },
        };
        // console.log(JSON.stringify(data, null, 2));
        await prisma.story.create({ data });

        if (!uploadedUserIds.has(uploaderId)) {
            const uploader = await prisma.user.findUnique({
                where: { id: uploaderId },
                select: { role: true },
            });
            console.log("uploader::::::::", uploader);
            if (uploader.role !== "UPLOADER") {
                await prisma.user.update({
                    where: { id: uploaderId },
                    data: { role: "UPLOADER" },
                });
            }
            uploadedUserIds.add(uploaderId);
        }
    }
    // for (const user of userData) {
    //     await prisma.user.create({ data: user });
    // }
}

main()
    .catch((e) => {
        console.error("❌ Seeding failed:", e);
        process.exit(1);
    })
    .finally(() => {
        prisma.$disconnect();
        console.log("✅ Prisma client disconnected");
    });

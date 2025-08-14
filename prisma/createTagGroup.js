import { PrismaClient } from "../app/generated/prisma/index.js";
import { randomItem, toSlug } from "./helper-prisma.js";

const prisma = new PrismaClient({ log: ["query", "info"] });

const tagData = [
    {
        name: "Tình trạng",
        tags: ["Còn tiếp", "Hoàn thành", "Tạm dừng"],
    },
    {
        name: "Thuộc tính",
        tags: ["Chọn lọc", "Chất lượng cao", "Miễn phí", "Thu phí"],
    },
    {
        name: "Loại",
        tags: ["Chuyển ngữ", "Sáng tác"],
    },
    {
        name: "Số chương",
        tags: ["<300", "300-600", "600-1000", ">1000"],
    },
    {
        name: "Thể loại",
        tags: [
            "Tiên Hiệp",
            "Huyền Huyễn",
            "Khoa Huyễn",
            "Võng Du",
            "Đô Thị",
            "Đồng Nhân",
            "Dã sử",
            "Cạnh Kỹ",
            "Huyền Nghi",
            "Kiếm Hiệp",
            "Kỳ Ảo",
            "Light Novel",
        ],
    },
    {
        name: "Tính cách nhân vật chính",
        tags: [
            "Điềm Đạm",
            "Nhiệt Huyết",
            "Vô Sỉ",
            "Thiết Huyết",
            "Nhẹ Nhàng",
            "Cơ trí",
            "Lãnh Khốc",
            "Kiêu Ngạo",
            "Ngu Ngốc",
            "Giảo Hoạt",
        ],
    },
    {
        name: "Bối cảnh thế giới",
        tags: [
            "Đông Phương Huyền Huyễn",
            "Dị Thế Đại Lục",
            "Vương Triều Tranh Bá",
            "Cao Võ Thế Giới",
            "Tây Phương Kỳ Huyễn",
            "Hiện Đại Ma Pháp",
            "Hắc Ám Huyễn Tưởng",
            "Lịch Sử Thần Thoại",
            "Võ Hiệp Huyễn Tưởng",
            "Cổ Võ Tương Lai",
            "Tu Chân Văn Minh",
            "Huyễn Tưởng Tu Tiên",
            "Hiện Đại Tu Chân",
            "Thần Thoại Tu Chân",
            "Cổ Điển Tiên Hiệp",
            "Viễn Cổ Hồng Hoang",
            "Đô Thị Sinh Hoạt",
            "Đô Thị Dị Năng",
            "Thanh Xuân Vườn Trường",
            "Ngu Nhạc Minh Tinh",
            "Thương Chiến Chức Tràng",
            "Giá Không Lịch Sử",
            "Lịch Sử Quân Sự",
            "Dân Gian Truyền Thuyết",
            "Lịch Sử Quan Trường",
            "Hư Nghĩ Võng Du",
            "Du Hí Dị Giới",
            "Điện Tử Cạnh Kỹ",
            "Thể Dục Cạnh Kỹ",
            "Cổ Võ Cơ Giáp",
            "Thế Giới Tương Lai",
            "Tinh Tế Văn Minh",
            "Tiến Hoá Biến Dị",
            "Mạt Thế Nguy Cơ",
            "Thời Không Xuyên Toa",
            "Quỷ Bí Huyền Nghi",
            "Kỳ Diệu Thế Giới",
            "Trinh Tham Thôi Lý",
            "Thám Hiểm Sinh Tồn",
            "Cung Vi Trạch Đấu",
            "Kinh Thương Chủng Điển",
            "Tiên Lữ Kỳ Duyên",
            "Hào Môn Thế Gia",
            "Dị Tộc Luyến Tình",
            "Ma Pháp Huyễn Tình",
            "Tinh Tế Luyến Ca",
            "Linh Khí Khôi Phục",
            "Chư Thiên Vạn Giới",
            "Nguyên Sinh Huyễn Tưởng",
            "Yêu Đương Thường Ngày",
            "Diễn Sinh Đồng Nhân",
            "Cáo Tiếu Thổ Tào",
        ],
    },
    {
        name: "Lưu Phái",
        tags: [
            "Hệ Thống",
            "Lão Gia",
            "Bàn Thờ",
            "Tuỳ Thân",
            "Phàm Nhân",
            "Vô Địch",
            "Biến Thân",
            "Cổ Ngu",
            "Chuyển Thế",
            "Xuyên Sách",
            "Đàn Xuyên",
            "Phế Tài",
            "Dưỡng Thành",
            "Cơm Mềm",
            "Vô Hạn",
            "Mary Sue",
            "Cá Mặn",
            "Xây Dựng Thế Lực",
            "Xuyên Nhanh",
            "Nữ Phụ",
            "Vả Mặt",
            "Sảng Văn",
            "Xuyên Không",
            "Ngọt Sủng",
            "Ngự Thú",
            "Điền Viên",
            "Toàn Dân",
            "Mỹ Thực",
            "Phản Phái",
            "Sau Màn",
            "Thiên Tài",
        ],
    },
];

async function createTagGroup() {
    for (const group of tagData) {
        const createdGroup = await prisma.tagGroup.create({
            data: {
                name: group.name,
                slug: toSlug(group.name),
                tags: {
                    create: group.tags.map((label) => ({
                        label,
                        slug: toSlug(label),
                    })),
                },
            },
        });
        console.log(`✅ Created TagGroup: ${createdGroup.name}`);
    }
}
async function updateAllTagSlug() {
    const tags = await prisma.tag.findMany();
    for (const tag of tags) {
        const slug = toSlug(tag.label);
        await prisma.$transaction(async (tx) => {
            await tx.tag.update({
                where: {
                    id: tag.id,
                },
                data: {
                    slug,
                },
            });
        });
        console.log(`✅ Updated tag "${tag.label}" -> "${slug}"`);
    }
}

async function addTagsToStory() {
    let storyIds = await prisma.story.findMany({
        where: {
            tags: {
                none: {},
            },
        },
        select: {
            id: true,
        },
    });

    const tagGroup = await prisma.tagGroup.findMany({
        include: {
            tags: true,
        },
    });

    console.log("List TagGroup from db:::::::::::::", tagGroup);

    for (const story of storyIds) {
        console.log("---------------------------------------------------");
        console.log(`Story have ${story.id}`);

        const selectedTags = tagGroup
            .map((group) => randomItem(group.tags))
            .filter(Boolean);

        console.log(`Story ${story.id} have selectedTags::::::`, selectedTags);

        await prisma.$transaction(async (tx) => {
            await prisma.story.update({
                where: {
                    id: story.id,
                },
                data: {
                    tags: {
                        connect: selectedTags.map((tag) => ({ id: tag.id })),
                    },
                },
            });
        });
    }

    console.log(`✅ Gán tags cho truyện thành công.`);
}

export async function main() {
    // await createTagGroup();
    // await addTagsToStory();
    try {
        console.log("🎉 All TagGroup and Tags have already updated!");
    } catch (err) {
        console.log("EORRRRRRR: ❌❌❌", err);
    }
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

import { prisma } from "../lib/prisma.js";
import {
    extractSlugFromStringUrl,
    generateRandomElement,
    generateTextWithSentences,
    generateUniqueSlug,
    getTitleFromSlug,
    randomItem,
    toSlug,
} from "./helper-prisma.js";

const arrayUrl = [
    "https://static.cdnno.com/poster/cao-vo-tu-la-gan-nhi-lang-than-thien-phu-bat-dau-manh-len/300.jpg?1736326925",
    "https://static.cdnno.com/poster/da-vo-cuong/300.jpg?1725767091",
    "https://static.cdnno.com/poster/quang-am-chi-ngoai/300.jpg?1718153607",
    "https://static.cdnno.com/poster/manh-len-tu-huyen-lenh-bat-dau/300.jpg?1748587111",
    "https://static.cdnno.com/poster/van-phap-dao-quan-tu-tieu-van-vu-thuat-bat-dau/300.jpg?1745485241",
    "https://static.cdnno.com/poster/hao-huu-tu-vong-ta-tu-vi-lai-tang-len/300.jpg?1642214772",
    "https://static.cdnno.com/poster/thai-co-than-ton/300.jpg?1745457668",
    "https://static.cdnno.com/poster/tu-trong-tro-choi-rut-ra-ky-nang-ta-phat-dat/300.jpg?1749917245",
    "https://static.cdnno.com/poster/tuyet-doi-van-menh-tro-choi/300.jpg?1713158366",
    "https://static.cdnno.com/poster/bat-dau-danh-dau-hoang-co-thanh-the/300.jpg?1737708504",
    "https://static.cdnno.com/poster/van-co-than-de/300.jpg?1585205583",
    "https://static.cdnno.com/poster/xich-tam-tuan-thien/300.jpg?1718940378",
    "https://static.cdnno.com/poster/tran-hoi-truong-sinh/300.jpg?1714986700",
    "https://static.cdnno.com/poster/cau-tha-thanh-thanh-nhan-tien-quan-trieu-ta-cham-ngua/300.jpg?1719031730",
    "https://static.cdnno.com/poster/tu-luyen-gian-luoc-hoa-cong-phap-bat-dau/300.jpg?1719733771",
    "https://static.cdnno.com/poster/toan-dan-tinh-hai-thoi-dai/300.jpg?1716370993",
    "https://static.cdnno.com/poster/vo-thanh/300.jpg?1734430675",
    "https://static.cdnno.com/poster/thai-hu-chi-ton/300.jpg?1751029137",
    "https://static.cdnno.com/poster/than-de-vo-thuong/300.jpg?1596110562",
    "https://static.cdnno.com/poster/nu-de-toa-ha-de-nhat-cho-san/300.jpg?1715218404",
    "https://static.cdnno.com/poster/ta-co-mot-than-bi-dong-ky/300.jpg?1738217652",
    "https://static.cdnno.com/poster/som-dang-luc-the-gioi-tro-choi-bat-dau-thong-gia-nu-de/300.jpg?1741672088",
    "https://static.cdnno.com/poster/doc-tieu-song-the/300.jpg?1751365424",
    "https://static.cdnno.com/poster/ta-giao-phu-than-phan-bi-mon-do-nhom-boc-quang/300.jpg?1746262131",
    "https://static.cdnno.com/poster/trung-sinh-2011-tu-dai-hoc-hang-hai-tro-thanh-985-danh-giao/300.jpg?1715853623",
    "https://static.cdnno.com/poster/bi-hoc-ty-y-lai-vao-thoi-gian/300.jpg?1748844556",
    "https://static.cdnno.com/poster/sieu-cap-phan-giai-he-thong-mot-khoa-thang-cap/300.jpg?1749022653",
];

const listTitle = [
    {
        key: "cao-vo-tu-la-gan-nhi-lang-than-thien-phu-bat-dau-manh-len",
        value: "Cao Võ: Từ Lá Gan Nhị Lang Thần Thiên Phú Bắt Đầu Mạnh Lên",
    },
    {
        key: "da-vo-cuong",
        value: "Dạ vô cương",
    },
    {
        key: "quang-am-chi-ngoai",
        value: "Quang âm chi ngoại",
    },
    {
        key: "manh-len-tu-huyen-lenh-bat-dau",
        value: "Mạnh lên từ huyện lệnh bắt đầu",
    },
    {
        key: "van-phap-dao-quan-tu-tieu-van-vu-thuat-bat-dau",
        value: "Vạn pháp đạo quân từ tiểu vân vũ thuật bắt đầu",
    },
    {
        key: "hao-huu-tu-vong-ta-tu-vi-lai-tang-len",
        value: "Hão hữu tử vong ta tu vi lại tăng lên",
    },
    {
        key: "thai-co-than-ton",
        value: "Thái cổ thần tôn",
    },
    {
        key: "tu-trong-tro-choi-rut-ra-ky-nang-ta-phat-dat",
        value: "Từ trong trò chơi rút ra kỹ năng, ta phát đạt",
    },
    {
        key: "tuyet-doi-van-menh-tro-choi",
        value: "Tuyệt đối vận mệnh trò chơi",
    },
    {
        key: "bat-dau-danh-dau-hoang-co-thanh-the",
        value: "Bắt đầu đánh dấu hoang cổ thánh thể",
    },
    {
        key: "van-co-than-de",
        value: "Vạn cổ thần đế",
    },
    {
        key: "xich-tam-tuan-thien",
        value: "Xích tâm tuần thiên",
    },
    {
        key: "tran-hoi-truong-sinh",
        value: "Trận hỏi trường sinh",
    },
    {
        key: "cau-tha-thanh-thanh-nhan-tien-quan-trieu-ta-cham-ngua",
        value: "Cẩu thả thành thánh nhân, tiên quan triệu ta chăm ngựa",
    },
    {
        key: "tu-luyen-gian-luoc-hoa-cong-phap-bat-dau",
        value: "Tu luyện giản lược hoá công pháp bắt đầu",
    },
    { key: "toan-dan-tinh-hai-thoi-dai", value: "Toàn dân tinh hải thời đại" },

    { key: "vo-thanh", value: "Võ thánh" },

    { key: "thai-hu-chi-ton", value: "Thái hư chí tôn" },

    { key: "than-de-vo-thuong", value: "Thần đế vô thượng" },

    {
        key: "nu-de-toa-ha-de-nhat-cho-san",
        value: "Nữ đế toạ hạ đệ nhất chó săn",
    },

    { key: "ta-co-mot-than-bi-dong-ky", value: "Ta có một thân bị động kỹ" },

    {
        key: "som-dang-luc-the-gioi-tro-choi-bat-dau-thong-gia-nu-de",
        value: "Sớm đăng lục thế giới trò chơi bắt đầu thông gia nữ đế",
    },

    { key: "doc-tieu-song-the", value: "Độc tiêu song thế" },

    {
        key: "ta-giao-phu-than-phan-bi-mon-do-nhom-boc-quang",
        value: "Ta Giáo phụ thân phận, bị môn đồ nhóm bộc quang",
    },

    {
        key: "trung-sinh-2011-tu-dai-hoc-hang-hai-tro-thanh-985-danh-giao",
        value: "Trùng sinh 2011, Từ Đại học hạng hai trở thành 985 danh giáo",
    },

    {
        key: "bi-hoc-ty-y-lai-vao-thoi-gian",
        value: "Bị học tỷ ỷ lại vào thời gian",
    },

    {
        key: "sieu-cap-phan-giai-he-thong-mot-khoa-thang-cap",
        value: "Siêu cấp phân giải hệ thống một khoá thăng cấp",
    },
];

const arrayAuthor = [
    "Nỗ Lực Cật Ngư",
    "Bất Tại Ý Trung Nhân",
    "Tùng Thanh",
    "Khinh Lạc Ngữ",
    "Cửu Thượng Thiêm",
    "Du Vịnh Quan Quân",
    "Thụy Bất Tỉnh Đích Miêu 9",
    "Sở Trường Ca",
    "Hạ Thiên Phiên Xướng",
    "Ngã Thị Ngưu Chiến Sĩ",
    "Ám Ma Sư",
    "Phong Quá Trường An",
    "Biệt Nhượng Ngã Thông Tiêu",
    "Nhất Cân Thụ Diệp",
    "Bát Hoang Phong Vũ Các",
    "Ấu Nhi Viên Tiểu Tần",
    "Vô Túy Xuân Thu",
    "Hạ Hạ 11",
    "Hủ Hoa Lạc Vu Đình Ngoại",
    "Tiêu Sở Hoàn Một Thụy",
    "Ngao Dạ Cật Bình Quả",
    "Thập Vạn Thái Đoàn",
    "Oa Ngưu Cuồng Bôn",
    "Thương Thiên Bá Chủ",
    "Điền Đãi",
    "Sơn Cao Địa Huýnh",
];

async function updateAllSlugAndTitleStories() {
    const stories = await prisma.story.findMany();

    for (const story of stories) {
        if (!story.stringUrl) continue;

        const baseSlug = extractSlugFromStringUrl(story.stringUrl);

        if (!baseSlug) continue;

        const uniqueSlug = await generateUniqueSlug(baseSlug);

        const updatedTitle = getTitleFromSlug(uniqueSlug, listTitle);

        await prisma.$transaction(async (tx) => {
            await tx.story.update({
                where: {
                    id: story.id,
                },
                data: {
                    slug: uniqueSlug,
                    title: updatedTitle,
                },
            });
        });
        console.log(
            `✅ Updated sucessfully story id=${story.id} with slug = ${uniqueSlug} and title = ${updatedTitle}`
        );
    }
    console.log("✅ Done updated successfully All Slug And Title");
}

async function createManyAuthor() {
    const authors = await prisma.author.createMany({
        data: arrayAuthor.map((author) => ({
            name: author,
            slug: toSlug(author),
        })),
    });
    console.log(`✅ Seed authors completed!`, authors);
}

async function createAndCheckConstraintAuthor() {
    const authorToSeed = arrayAuthor.map((name) => ({
        name,
        slug: toSlug(name),
    }));

    const slugs = authorToSeed.map((a) => a.slug);

    const existing = await prisma.author.findMany({
        where: {
            slug: {
                in: slugs,
            },
        },
        select: {
            slug: true,
        },
    });

    const existingSlugs = new Set(existing.map((e) => e.slug));

    const newAuthors = authorToSeed.filter((a) => !existingSlugs.has(a.slug));

    if (newAuthors.length > 0) {
        const newA = await prisma.author.createMany({
            data: newAuthors.map((a) => ({
                name: a.name,
                slug: toSlug(a.slug),
            })),
        });
        console.log(`Đã thêm author mới:`, newA);
    } else {
        console.log("Không có author nào cần thêm.");
    }
}

async function updateAuthorSlug() {
    const authors = await prisma.author.findMany();
    for (const author of authors) {
        const slug = toSlug(author.name);
        await prisma.$transaction(async (tx) => {
            await tx.author.update({
                where: {
                    id: author.id,
                },
                data: {
                    slug,
                },
            });
        });
        console.log(`✅ Updated tag "${author.name}" -> "${slug}"`);
    }
}

async function createManyStory() {
    const users = await prisma.user.findMany({
        select: {
            id: true,
        },
    });

    const authors = await prisma.author.findMany({
        select: {
            id: true,
        },
    });

    for (let i = 0; i <= 100; i++) {
        const totalChapters = Math.floor(Math.random() * (100 - 10 + 1)) + 10;

        const chapters = Array.from({ length: totalChapters }, (_, i) => ({
            name: `Chương ${i + 1}: Đây là tiêu đề cho chương ${i + 1}`,
            number: i + 1,
            content: generateTextWithSentences(600),
        }));

        const randomImage = randomItem(arrayUrl);

        const randomUploader = randomItem(users);

        const randomAuthor = randomItem(authors);

        await prisma.story.create({
            data: {
                title: `Truyện số ${i + 1}`,
                stringUrl: randomImage,
                totalChapters,
                uploaderId: randomUploader.id,
                authorId: randomAuthor.id,
                introduce: `Đây là giới thiệu cho truyện số ${
                    i + 1
                }: ${generateTextWithSentences(100)}`,
                chapters: {
                    create: chapters,
                },
            },
        });
    }
    console.log(`✅ Seed completed!`);
}

async function updateSlugStory() {
    const stories = await prisma.story.findMany();

    for (const story of stories) {
        await prisma.$transaction(async (tx) => {
            await tx.story.update({
                where: {
                    id: story.id,
                },
                data: {
                    slug: toSlug(story.title),
                },
            });
        });
    }
}

async function updateFieldManagerPick() {
    let stories = await prisma.story.findMany({
        where: {
            manager_pick: 0,
        },
        select: {
            id: true,
        },
    });

    stories = stories.map((story) => story.id);
    console.log("Stories:::", stories);
    const randomCount = Math.floor(Math.random() * stories.length) + 1;
    const randomStories = generateRandomElement(stories, randomCount);

    console.log(
        `Stories have ${randomCount} random will update field manager_pick:`,
        randomStories
    );

    await prisma.$transaction(async (tx) => {
        await tx.story.updateMany({
            where: {
                id: {
                    in: randomStories,
                },
            },
            data: {
                manager_pick: 1,
            },
        });
    });
}

export async function main() {
    // await updateSlugStory();
    // await createAndCheckConstraintAuthor();
    // await createManyAuthor();
    // await createManyStory();
    // await updateAllSlugAndTitleStories();
    try {
        await updateFieldManagerPick();
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

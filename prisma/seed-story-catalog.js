import { prisma } from "../lib/prisma.js";

const FIXTURE_PREFIX = "catalog-fixture-";
const FIXTURE_COUNT = 48;
const covers = ["/300.jpg", "/avatar_default.jpg", "/image_user.jpg"];
const genreSlugs = [
    "tien-hiep",
    "huyen-huyen",
    "do-thi",
    "khoa-huyen",
    "huyen-nghi",
    "kiem-hiep",
];
const statusSlugs = ["con-tiep", "hoan-thanh", "tam-dung"];
const attributeSlugs = ["chat-luong-cao", "mien-phi", "thu-phi"];
const personalitySlugs = ["co-tri", "lanh-khoc", "nhiet-huyet", "diem-dam"];
const worldSlugs = [
    "hien-dai-tu-chan",
    "tinh-te-van-minh",
    "dong-phuong-huyen-huyen",
    "do-thi-sinh-hoat",
];
const styleSlugs = ["pham-nhan", "he-thong", "vo-dich", "xuyen-khong"];
const chapterCounts = [120, 299, 300, 599, 600, 1000, 1001, 1260];

async function seedStoryCatalog() {
    const uploader = await prisma.user.findFirst({ select: { id: true } });
    if (!uploader) throw new Error("Cần ít nhất một user trước khi seed catalog.");

    const authorA = await prisma.author.upsert({
        where: { slug: `${FIXTURE_PREFIX}tac-gia-khao-nghiem` },
        update: { name: "Tác Giả Khảo Nghiệm" },
        create: {
            name: "Tác Giả Khảo Nghiệm",
            slug: `${FIXTURE_PREFIX}tac-gia-khao-nghiem`,
        },
    });
    const authorB = await prisma.author.upsert({
        where: { slug: `${FIXTURE_PREFIX}nguoi-viet-thu-nghiem` },
        update: { name: "Người Viết Thử Nghiệm" },
        create: {
            name: "Người Viết Thử Nghiệm",
            slug: `${FIXTURE_PREFIX}nguoi-viet-thu-nghiem`,
        },
    });

    for (let index = 0; index < FIXTURE_COUNT; index += 1) {
        const ordinal = String(index + 1).padStart(2, "0");
        const slug = `${FIXTURE_PREFIX}${ordinal}-demo-loc-hanh-trinh-tinh-ha`;
        const latestChapterAt = new Date(
            Date.UTC(2026, 6, 18, 12 - (index % 12), index % 2, 0),
        );
        const tags = [
            statusSlugs[index % statusSlugs.length],
            attributeSlugs[index % attributeSlugs.length],
            index % 2 ? "sang-tac" : "chuyen-ngu",
            index % 4 === 0 ? "1000" : index % 4 === 1 ? "300" : index % 4 === 2 ? "300-600" : "600-1000",
            genreSlugs[index % genreSlugs.length],
            personalitySlugs[index % personalitySlugs.length],
            worldSlugs[index % worldSlugs.length],
            styleSlugs[index % styleSlugs.length],
        ];
        const story = await prisma.story.upsert({
            where: { slug },
            update: {
                title: `[Demo Lọc] Hành Trình Tinh Hà ${ordinal}`,
                totalChapters: chapterCounts[index % chapterCounts.length],
                latestChapterAt,
                manager_pick: index % 5 === 0 ? 1 : 0,
                tags: { set: tags.map((tagSlug) => ({ slug: tagSlug })) },
            },
            create: {
                title: `[Demo Lọc] Hành Trình Tinh Hà ${ordinal}`,
                slug,
                stringUrl: covers[index % covers.length],
                totalChapters: chapterCounts[index % chapterCounts.length],
                latestChapterAt,
                introduce:
                    "Fixture kiểm thử tìm kiếm, bộ lọc, sắp xếp và infinite scroll trên PostgreSQL.",
                manager_pick: index % 5 === 0 ? 1 : 0,
                uploader: { connect: { id: uploader.id } },
                author: {
                    connect: { id: index % 2 ? authorA.id : authorB.id },
                },
                tags: { connect: tags.map((tagSlug) => ({ slug: tagSlug })) },
            },
        });

        await prisma.storyStats.upsert({
            where: { storyId: story.id },
            update: {
                totalReads: 10_000 + (index % 9) * 25_000,
                averageRating: 3.5 + (index % 4) * 0.4,
            },
            create: {
                storyId: story.id,
                totalReads: 10_000 + (index % 9) * 25_000,
                averageRating: 3.5 + (index % 4) * 0.4,
            },
        });
    }

    console.log(`Seeded ${FIXTURE_COUNT} persistent catalog fixtures.`);
}

seedStoryCatalog()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());

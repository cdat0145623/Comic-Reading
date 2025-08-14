import { LoremIpsum } from "lorem-ipsum";

const lorem = new LoremIpsum({
    wordsPerSentence: { min: 3, max: 10 },
    sentencesPerParagraph: { min: 3, max: 5 },
});
function generateRandomSentence() {
    return lorem.generateSentences(1);
}

function generateRandomWord(wordCount) {
    return wordCount
        ? lorem.generateWords(wordCount)
        : lorem.generateSentences(1);
}

function generateRandomElement(arr, count) {
    const suffled = [...arr].sort(() => 0.5 - Math.random());
    return suffled.slice(0, count);
}

const randomItem = (array) => array[Math.floor(Math.random() * array.length)];

function generateRandomRating() {
    const min = 3;
    const max = 5;
    const random = Math.random() * (max - min) + min;
    return Math.floor(random * 10) / 10;
}

function getRandomChapters(startNumber, count) {
    const chapters = [];
    for (let i = 0; i < count; i++) {
        const number = startNumber + i + 1;
        chapters.push({
            number,
            name: `Chương ${number}`,
            content: generateTextWithSentences(200),
        });
    }
    console.log("chapters", chapters);
    return chapters;
}
function toSlug(str) {
    return str
        .normalize("NFD") // tách dấu ra khỏi chữ (é → e + ́)
        .replace(/[\u0300-\u036f]/g, "") // xóa các dấu (accents)
        .replace(/Đ/g, "D") // xử lý chữ Đ
        .replace(/đ/g, "d") // xử lý chữ đ
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "") // loại bỏ ký tự đặc biệt
        .trim()
        .replace(/\s+/g, "-"); // thay khoảng trắng thành dấu gạch ngang
}

function generateTextWithSentences(wordCount = 500) {
    const words = lorem.generateWords(wordCount).split(" ");
    const sentences = [];
    let i = 0;

    while (i < words.length) {
        const sentenceLength = Math.floor(Math.random() * 8) + 3;
        const sentenceWords = words.slice(i, i + sentenceLength);

        if (sentenceWords.length === 0) break;

        sentenceWords[0] =
            sentenceWords[0][0].toUpperCase() + sentenceWords[0].slice(1);

        const sentence = sentenceWords.join(" ") + ".";
        sentences.push(sentence);

        i += sentenceLength;
    }
    return sentences.join(" ");
}

function capitalizeTitle(title) {
    return title.replace(
        /(^|\s|[:.,])([a-zàáạảãâầấậẩẫăằắặẳẵêềếệểễôồốộổỗơờớợởỡưừứựửữèéẹẻẽùúụủũìíịỉĩòóọỏõỳýỵỷỹđ])(\S*)/gi,
        (_, sep, first, rest) => sep + first.toUpperCase() + rest
    );
}

function getTitleFromSlug(slug, listTitle) {
    const match = slug.match(/^(.+?)(?:-(\d+))?$/);
    const baseSlug = match[1];
    const suffix = match[2];

    const baseEntry = listTitle.find((entry) => entry.key === baseSlug);

    if (!baseEntry)
        throw new Error(
            "Khong tim thay bat cu slug nao phu hop, Xin vui long check lai listTitle"
        );

    let title = baseEntry.value;

    if (suffix) {
        title = `${title} ${suffix}`;
    }

    return capitalizeTitle(title);
}

function extractSlugFromStringUrl(stringUrl) {
    const match = stringUrl.match(/poster\/([^/]+)\//);
    return match ? match[1] : null;
}

async function generateUniqueSlug(baseSlug) {
    let slug = baseSlug;
    let count = 0;
    while (true) {
        const existing = await prisma.story.findUnique({
            where: {
                slug,
            },
        });

        if (!existing) break;

        count += 1;
        slug = `${baseSlug}-${count}`;
    }

    return slug;
}

function countTotalWorlds(fields) {
    return [fields.character, fields.plot, fields.world, fields.content]
        .filter(Boolean)
        .map(function (text) {
            return text.trim().split(/\s+/).filter(Boolean).length;
        })
        .reduce(function (a, b) {
            return a + b;
        }, 0);
}

export {
    toSlug,
    generateTextWithSentences,
    generateRandomSentence,
    generateRandomElement,
    randomItem,
    generateRandomRating,
    getRandomChapters,
    capitalizeTitle,
    getTitleFromSlug,
    extractSlugFromStringUrl,
    generateUniqueSlug,
    generateRandomWord,
    countTotalWorlds,
};

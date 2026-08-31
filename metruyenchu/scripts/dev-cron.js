import cron from "node-cron";
import { updateStoryStats, updateTopStoryRead } from "../app/_lib/cron-job.js";
import { main as createRating } from "../prisma/createRating.js";

const durations = [5, 10, 15, 30, 60];
cron.schedule("*/2 * * * *", async () => {
    console.log("⏰ New cron cycle:", new Date());

    // 1. Seed trước
    console.log("🌱 Running seed job...");
    await createRating(); // sẽ đợi seed xong mới qua bước 2

    // 2. Sau 60s mới thống kê
    setTimeout(async () => {
        console.log("📊 Running statistics job...");
        await updateStoryStats();
    }, 60 * 1000);
});

// cron.schedule("* * * * *", async () => {
//     console.log("⏰ Running story stats update job...");

//     await updateStoryStats();
// });

// cron.schedule("* * * * *", async () => {
//     console.log("⏰ Running top story update job...");
//     // const minutes = new Date().getMinutes();

//     for (const d of durations) {
//         await updateTopStoryRead(d);
//     }
// });

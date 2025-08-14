import cron from "node-cron";
import { updateTopStoryRead } from "../app/_lib/cron-job.js";

const durations = [5, 10, 15, 30, 60];

cron.schedule("* * * * *", async () => {
    console.log("⏰ Running top story update job...");
    // const minutes = new Date().getMinutes();

    for (const d of durations) {
        await updateTopStoryRead(d);
    }
});

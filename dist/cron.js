"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupCronJobs = setupCronJobs;
const node_cron_1 = __importDefault(require("node-cron"));
const client_1 = require("@prisma/client");
const scrapper_1 = require("./scrapper");
const prisma = new client_1.PrismaClient();
const cronTasks = {};
async function setupCronJobs() {
    Object.values(cronTasks).forEach(task => task.stop());
    const categories = await prisma.category.findMany({
        include: { websites: true }
    });
    categories.forEach(category => {
        const task = node_cron_1.default.schedule(category.schedule, async () => {
            console.log(`🕑 Scraping category: ${category.name}`);
            for (const website of category.websites) {
                console.log(`Scraping: ${website.url}`);
                const result = await (0, scrapper_1.scrapeWebsite)(website.url);
                if (result) {
                    await prisma.analysis.create({
                        data: {
                            websiteId: website.id,
                            h1: result.h1,
                            h2: result.h2Text,
                            paragraph: result.pText,
                            cta: result.ctaText,
                            bgColor: result.bgColor,
                        }
                    });
                    console.log(`✅ Saved analysis for ${website.url}`);
                }
                else {
                    console.log(`❌ Failed to scrape ${website.url}`);
                }
            }
        });
        cronTasks[category.id] = task;
    });
    console.log('✅ Cron jobs updated successfully');
}
setupCronJobs();
//# sourceMappingURL=cron.js.map
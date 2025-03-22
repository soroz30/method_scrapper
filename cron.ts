import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { scrapeWebsite } from './scrapper';

const prisma = new PrismaClient();
const cronTasks: Record<number, cron.ScheduledTask> = {};

export async function setupCronJobs() {
  Object.values(cronTasks).forEach(task => task.stop());

  const categories = await prisma.category.findMany({
    include: { websites: true }
  });

  categories.forEach(category => {
    const task = cron.schedule(category.schedule, async () => {
      console.log(`🕑 Scraping category: ${category.name}`);

      for (const website of category.websites) {
        console.log(`Scraping: ${website.url}`);
        const result = await scrapeWebsite(website.url);

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
        } else {
          console.log(`❌ Failed to scrape ${website.url}`);
        }
      }
    });

    cronTasks[category.id] = task;
  });

  console.log('✅ Cron jobs updated successfully');
}

setupCronJobs();


import express, { Request, Response } from 'express';
import cors from 'cors';
import './cron';
import { PrismaClient } from '@prisma/client';
import { scrapeWebsite } from './scrapper';
import { setupCronJobs } from './cron';

const app = express();
const prisma = new PrismaClient();

const allowedOrigins = [
  'http://localhost:3000',
];

app.use(cors({
  origin: (origin, callback) => {
      console.log(`Request received from origin: ${origin}`);
      if (!origin || origin === 'null' || allowedOrigins.includes(origin)) {
          callback(null, true);
      } else {
          callback(new Error('Not allowed by CORS'));
      }
  },
}));

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('🚀 Website Analyzer API running!');
});

app.get('/analyses', async (req: Request, res: Response) => {
  const analyses = await prisma.analysis.findMany({ orderBy: { analyzedAt: 'desc' }, include: { website: true } });
  res.json(analyses);
});

app.post('/analyses', async (req: Request, res: Response) => {
  const {url} = req.body
  const analyses = await scrapeWebsite(url)
  res.json(analyses);
});

app.get('/categories', async (_, res) => {
  const categories = await prisma.category.findMany({ include: { websites: true } });
  res.json(categories);
});

app.post('/categories', async (req, res) => {
  console.log(req.body)
  const { name } = req.body;
  const category = await prisma.category.create({ data: { name } });
  res.json(category);
});

app.delete('/categories/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  await prisma.category.delete({ where: { id } });
  res.json({ success: true });
});

app.put('/categories/:id/schedule', async (req, res) => {
  const id = parseInt(req.params.id);
  const { schedule } = req.body;

  const updatedCategory = await prisma.category.update({
    where: { id },
    data: { schedule }
  });

  res.json(updatedCategory);
});

app.get('/websites', async (_, res) => {
  const websites = await prisma.website.findMany({ include: { category: true, analyses: true } });
  res.json(websites);
});

app.post('/websites', async (req, res) => {
  const { url, categoryId } = req.body;
  const website = await prisma.website.create({
    data: {
      url,
      categoryId,
    }
  });
  res.json(website);
});

app.delete('/websites/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  await prisma.website.delete({ where: { id } });
  res.json({ success: true });
});

app.get('/websites/:id/analyses', async (req, res) => {
  const websiteId = parseInt(req.params.id);
  const analyses = await prisma.analysis.findMany({
    where: { websiteId },
    orderBy: { analyzedAt: 'desc' }
  });
  res.json(analyses);
});

app.post('/cronjobs/update', async (_, res) => {
  await setupCronJobs();
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
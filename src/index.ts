import { DORK_QUERIES } from './config/dorks.js';
import { searchWithJina } from './services/jina.js';
import { sendToSheet } from './services/sheet.js';
import { JobItem } from './utils/parser.js';

async function run() {
  const JINA_KEY = process.env.JINA_API_KEY || '';
  const SHEET_URL = process.env.SHEET_WEBHOOK_URL || '';

  if (!JINA_KEY || !SHEET_URL) {
    console.error('Thiếu biến môi trường JINA_API_KEY hoặc SHEET_WEBHOOK_URL!');
    process.exit(1);
  }

  console.log('Bắt đầu quá trình quét tin freelance...');
  const collectedJobs: JobItem[] = [];

  for (const dork of DORK_QUERIES) {
    console.log(`-> Đang quét dork: ${dork}`);
    const results = await searchWithJina(dork, JINA_KEY);
    collectedJobs.push(...results);
  }

  // Khử bài trùng lặp qua URL trong cùng 1 lần quét
  const uniqueJobs = Array.from(
    new Map(collectedJobs.map(item => [item.url, item])).values()
  );

  console.log(`Tổng số tin tìm được: ${uniqueJobs.length}`);

  if (uniqueJobs.length > 0) {
    await sendToSheet(uniqueJobs, SHEET_URL);
  }
  console.log('Hoàn thành chu kỳ quét.');
}

run();

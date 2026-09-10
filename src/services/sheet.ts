import { JobItem } from '../utils/parser.js';

export async function sendToSheet(jobs: JobItem[], webhookUrl: string): Promise<void> {
  if (!webhookUrl || jobs.length === 0) return;

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(jobs)
    });
    const result = await res.text();
    console.log(`Đã xuất ${jobs.length} bài đăng lên Sheet:`, result);
  } catch (err) {
    console.error('Lỗi khi gửi dữ liệu sang Google Sheet:', err);
  }
}

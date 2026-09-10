import { JobItem, parsePlatform, extractBudget, extractContact } from '../utils/parser.js';

export async function searchWithJina(query: string, apiKey: string): Promise<JobItem[]> {
  const url = `https://s.jina.ai/${encodeURIComponent(query)}`;
  const jobs: JobItem[] = [];

  try {
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'X-Locale': 'vi-VN',
        'X-No-Cache': 'true' // Buộc lấy dữ liệu mới nhất (tránh cache cũ)
      }
    });

    if (!res.ok) return [];

    const md = await res.text();
    const sections = md.split(/\[\d+\] Title:/g);

    for (const section of sections) {
      if (!section.trim()) continue;

      const urlMatch = section.match(/URL Source:\s*(https?:\/\/[^\s\n]+)/);
      const titleMatch = section.match(/(.+?)\n/);

      if (urlMatch) {
        const postUrl = urlMatch[1].trim();
        const postTitle = titleMatch ? titleMatch[1].trim() : 'Tin tuyển freelance';
        const cleanContent = section.slice(0, 600).replace(/\n+/g, ' ');

        jobs.push({
          time: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
          platform: parsePlatform(postUrl),
          title: postTitle,
          content: cleanContent,
          budget: extractBudget(cleanContent),
          contact: extractContact(cleanContent),
          url: postUrl
        });
      }
    }
  } catch (err) {
    console.error(`Lỗi tìm kiếm Jina với câu query: "${query}"`, err);
  }

  return jobs;
}

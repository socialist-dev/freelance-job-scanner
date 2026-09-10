import { JobItem, parsePlatform, cleanRawContent, extractTimeAgoAndValidate, extractBudget, extractContact } from '../utils/parser';

export async function searchWithJina(query: string, apiKey: string): Promise<JobItem[]> {
  const url = `https://s.jina.ai/${encodeURIComponent(query)}`;
  const jobs: JobItem[] = [];

  try {
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'X-Locale': 'vi-VN',
        'X-No-Cache': 'true'
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

        // Bỏ qua nếu là link profile hoặc trang tìm kiếm
        if (postUrl.includes('/search') || postUrl.endsWith('.net/') || !postUrl.includes('/post/') && !postUrl.includes('/groups/') && !postUrl.includes('/status/')) {
          continue;
        }

        // Lọc bài đăng trong 24h
        const { isWithin24h, postedAgo } = extractTimeAgoAndValidate(section);
        if (!isWithin24h) continue;

        const cleanText = cleanRawContent(section);

        // Bỏ qua bài viết quá ngắn hoặc không chứa yêu cầu thực tế
        if (cleanText.length < 30) continue;

        jobs.push({
          scanTime: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
          platform: parsePlatform(postUrl),
          postedAgo: postedAgo,
          title: titleMatch ? titleMatch[1].trim() : 'Tìm Freelancer',
          requirements: cleanText.slice(0, 500) + '...', // Lấy đúng nội dung yêu cầu
          budget: extractBudget(cleanText),
          contact: extractContact(cleanText),
          url: postUrl
        });
      }
    }
  } catch (err) {
    console.error(`Lỗi Jina search: ${query}`, err);
  }

  return jobs;
}

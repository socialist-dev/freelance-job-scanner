export interface RawScrapedPost {
  platform: string;
  url: string;
  rawContent: string;
}

export function parsePlatform(url: string): string {
  if (url.includes('tiktok.com')) return 'TikTok';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
  if (url.includes('threads.net')) return 'Threads';
  if (url.includes('facebook.com')) return 'Facebook';
  if (url.includes('x.com') || url.includes('twitter.com')) return 'X';
  return 'Web / Khác';
}

export async function searchWithJina(query: string, apiKey: string): Promise<RawScrapedPost[]> {
  const url = `https://s.jina.ai/${encodeURIComponent(query)}`;
  const posts: RawScrapedPost[] = [];

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

      if (urlMatch) {
        const postUrl = urlMatch[1].trim();

        // Bỏ qua trang profile cá nhân rác không có video/post
        if (postUrl.includes('/search') || postUrl.endsWith('.net/')) continue;

        posts.push({
          platform: parsePlatform(postUrl),
          url: postUrl,
          rawContent: section
        });
      }
    }
  } catch (err) {
    console.error(`Lỗi tìm kiếm Jina: ${query}`, err);
  }

  return posts;
}

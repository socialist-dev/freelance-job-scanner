export async function scrapeDeepWithComments(targetUrl: string, apiKey: string): Promise<string | null> {
  if (!apiKey) return null;

  try {
    const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: targetUrl,
        formats: ['markdown'],
        // Tự động chờ 3s và cuộn trang để nạp toàn bộ bình luận của TikTok/Facebook
        actions: [
          { type: 'wait', milliseconds: 3000 },
          { type: 'scroll', direction: 'down' },
          { type: 'wait', milliseconds: 2000 }
        ]
      })
    });

    const json = (await res.json()) as any;
    return json?.data?.markdown || null;
  } catch (err) {
    console.error(`Lỗi Firecrawl cào sâu URL: ${targetUrl}`, err);
    return null;
  }
}

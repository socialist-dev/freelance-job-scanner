export async function scrapeDeepContent(targetUrl: string, apiKey: string): Promise<string | null> {
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
        formats: ['markdown']
      })
    });
    const json = (await res.json()) as any;
    return json?.data?.markdown || null;
  } catch {
    return null;
  }
}

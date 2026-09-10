import { BASE_DORK_QUERIES } from './config/dorks';
import { searchWithJina, RawScrapedPost } from './services/jina';
import { analyzeJobWithGemini, generateAIDorks, sleep } from './services/gemini';
import { sendToSheet } from './services/sheet';

async function run() {
  const JINA_KEY = process.env.JINA_API_KEY || '';
  const GEMINI_KEY = process.env.GEMINI_API_KEY || '';
  const SHEET_URL = process.env.SHEET_WEBHOOK_URL || '';

  if (!JINA_KEY || !GEMINI_KEY || !SHEET_URL) {
    console.error('❌ Thiếu biến môi trường cấu hình!');
    process.exit(1);
  }

  console.log('🚀 Bắt đầu chu kỳ quét Freelance Job (Mốc 7 ngày)...');
  let currentDorks = [...BASE_DORK_QUERIES];
  const rawPosts: RawScrapedPost[] = [];

  // Lượt 1: Quét danh sách toán tử mặc định
  for (const dork of currentDorks) {
    console.log(`🔍 Quét: ${dork}`);
    const results = await searchWithJina(dork, JINA_KEY);
    rawPosts.push(...results);
    await sleep(800); // Nghỉ nhẹ giữa các request Jina
  }

  let uniquePosts = Array.from(new Map(rawPosts.map(p => [p.url, p])).values());

  // Nếu tìm được quá ít bài (< 4 bài), kích hoạt Gemini tự tạo Dorking bổ sung
  if (uniquePosts.length < 4) {
    console.log('⚡ Kết quả ít hơn mong đợi. Kích hoạt AI sáng tạo thêm toán tử Dorking...');
    const aiDorks = await generateAIDorks(GEMINI_KEY);
    console.log('🤖 Toán tử AI đề xuất:', aiDorks);

    for (const dork of aiDorks) {
      const results = await searchWithJina(dork, JINA_KEY);
      rawPosts.push(...results);
      await sleep(800);
    }
    uniquePosts = Array.from(new Map(rawPosts.map(p => [p.url, p])).values());
  }

  console.log(`📌 Đã gom ${uniquePosts.length} bài viết tiềm năng. Bắt đầu thẩm định bằng Gemini...`);
  const approvedJobs: any[] = [];

  for (const post of uniquePosts) {
    // Nghỉ 1.5 giây giữa mỗi bài để chống Rate Limit / 503
    await sleep(1500);

    const aiResult = await analyzeJobWithGemini(post.rawContent, GEMINI_KEY);

    // CHẤP NHẬN: Bài tuyển thật VÀ trong vòng 7 ngày trở lại
    if (aiResult && aiResult.isValidJob && aiResult.isWithin7Days) {
      console.log(`✅ [DUYỆT - ${aiResult.postedAgo}] [${aiResult.categoryTag}] ${aiResult.jobTitle}`);
      approvedJobs.push({
        scanTime: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
        platform: post.platform,
        postedAgo: aiResult.postedAgo,
        categoryTag: aiResult.categoryTag,
        leadScore: aiResult.leadScore,
        title: aiResult.jobTitle,
        requirements: aiResult.jobRequirements,
        budget: aiResult.budget,
        contact: aiResult.contact,
        url: post.url
      });
    } else {
      console.log(`⏩ [BỎ QUA] Không đạt tiêu chuẩn hoặc > 7 ngày: ${post.url}`);
    }
  }

  if (approvedJobs.length > 0) {
    console.log(`📊 Đang xuất ${approvedJobs.length} bài đăng chất lượng lên Google Sheet...`);
    await sendToSheet(approvedJobs, SHEET_URL);
  } else {
    console.log('✨ Không có bài tuyển dụng mới trong 7 ngày qua.');
  }

  console.log('🎉 Hoàn thành chu kỳ quét.');
}

run();

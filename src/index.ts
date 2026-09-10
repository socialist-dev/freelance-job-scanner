import { DORK_QUERIES } from './config/dorks';
import { searchWithJina } from './services/jina';
import { analyzeJobWithGemini } from './services/gemini';
import { sendToSheet } from './services/sheet';

async function run() {
  const JINA_KEY = process.env.JINA_API_KEY || '';
  const GEMINI_KEY = process.env.GEMINI_API_KEY || '';
  const SHEET_URL = process.env.SHEET_WEBHOOK_URL || '';

  if (!JINA_KEY || !GEMINI_KEY || !SHEET_URL) {
    console.error('❌ Thiếu biến môi trường: JINA_API_KEY, GEMINI_API_KEY hoặc SHEET_WEBHOOK_URL!');
    process.exit(1);
  }

  console.log('🚀 Bắt đầu quét job freelance...');
  const rawPosts: any[] = [];

  for (const dork of DORK_QUERIES) {
    console.log(`🔍 Quét: ${dork}`);
    const results = await searchWithJina(dork, JINA_KEY);
    rawPosts.push(...results);
  }

  // Khử trùng URL trước khi gửi AI để tiết kiệm Token
  const uniquePosts = Array.from(new Map(rawPosts.map(p => [p.url, p])).values());
  console.log(`📌 Thu được ${uniquePosts.length} bài đăng thô. Bắt đầu dùng Gemini thẩm định...`);

  const approvedJobs: any[] = [];

  for (const post of uniquePosts) {
    const aiResult = await analyzeJobWithGemini(post.rawContent, GEMINI_KEY);

    // Lọc nghiêm ngặt: Phải là bài tuyển dụng THẬT và nằm trong 24H
    if (aiResult && aiResult.isValidJob && aiResult.isWithin24h) {
      console.log(`✅ [DUYỆT] [${aiResult.categoryTag}] [${aiResult.leadScore}] ${aiResult.jobTitle}`);
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
      console.log(`⏩ [BỎ QUA] Không hợp lệ hoặc đã quá 24h: ${post.url}`);
    }
  }

  if (approvedJobs.length > 0) {
    console.log(`📊 Đang xuất ${approvedJobs.length} job chất lượng cao vào Google Sheet...`);
    await sendToSheet(approvedJobs, SHEET_URL);
  } else {
    console.log('✨ Không có bài tuyển dụng mới nào đạt chuẩn trong 24h qua.');
  }

  console.log('🎉 Hoàn thành phiên quét.');
}

run();

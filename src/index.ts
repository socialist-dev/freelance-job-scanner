import { BASE_DORK_QUERIES } from './config/dorks';
import { searchWithJina, RawScrapedPost } from './services/jina';
import { analyzeJobWithGemini, generateAIDorks, sleep } from './services/gemini';
import { sendToSheet } from './services/sheet';

async function run() {
  const JINA_KEY = process.env.JINA_API_KEY || '';
  const GEMINI_KEY = process.env.GEMINI_API_KEY || '';
  const SHEET_URL = process.env.SHEET_WEBHOOK_URL || '';

  if (!JINA_KEY || !GEMINI_KEY || !SHEET_URL) {
    console.error('❌ Thiếu biến môi trường: JINA_API_KEY, GEMINI_API_KEY hoặc SHEET_WEBHOOK_URL!');
    process.exit(1);
  }

  console.log('🚀 Bắt đầu chu kỳ quét Freelance Job (Mốc 7 ngày, delay an toàn 5s)...');
  let currentDorks = [...BASE_DORK_QUERIES];
  const rawPosts: RawScrapedPost[] = [];

  // 1. Quét danh sách toán tử mặc định
  for (const dork of currentDorks) {
    console.log(`🔍 Quét dork: ${dork}`);
    const results = await searchWithJina(dork, JINA_KEY);
    rawPosts.push(...results);
    
    // Nghỉ 5 giây giữa các lượt tìm kiếm
    console.log('⏳ Chờ 5s trước khi quét dork tiếp theo...');
    await sleep(5000);
  }

  let uniquePosts = Array.from(new Map(rawPosts.map(p => [p.url, p])).values());

  // 2. Kích hoạt AI tạo thêm Dork nếu kết quả quá ít
  if (uniquePosts.length < 3) {
    console.log('⚡ Ít bài đăng quá. Kích hoạt AI tạo thêm toán tử mới...');
    const aiDorks = await generateAIDorks(GEMINI_KEY);
    console.log('🤖 Dork mới do AI tạo:', aiDorks);

    for (const dork of aiDorks) {
      const results = await searchWithJina(dork, JINA_KEY);
      rawPosts.push(...results);
      await sleep(5000);
    }
    uniquePosts = Array.from(new Map(rawPosts.map(p => [p.url, p])).values());
  }

  console.log(`📌 Gom được ${uniquePosts.length} bài đăng. Bắt đầu thẩm định bằng Gemini...`);
  const approvedJobs: any[] = [];

  // 3. Gửi từng bài cho Gemini phân tích
  for (let i = 0; i < uniquePosts.length; i++) {
    const post = uniquePosts[i];
    console.log(`[${i + 1}/${uniquePosts.length}] Đang thẩm định: ${post.url}`);

    const aiResult = await analyzeJobWithGemini(post.rawContent, GEMINI_KEY);

    if (aiResult && aiResult.isValidJob && aiResult.isWithin7Days) {
      console.log(`✅ [DUYỆT - ${aiResult.postedAgo}] [${aiResult.categoryTag}] [${aiResult.leadScore}] ${aiResult.jobTitle}`);
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
      console.log(`⏩ [BỎ QUA] Không đạt yêu cầu hoặc > 7 ngày: ${post.url}`);
    }

    // Tối thiểu 5 giây nghỉ giữa mỗi bài để chống spam API
    if (i < uniquePosts.length - 1) {
      console.log('⏳ Nghỉ 5s chống quá tải API...');
      await sleep(5000);
    }
  }

  // 4. Gửi dữ liệu vào Sheet
  if (approvedJobs.length > 0) {
    console.log(`📊 Đang xuất ${approvedJobs.length} bài đăng chuẩn vào Google Sheet...`);
    await sendToSheet(approvedJobs, SHEET_URL);
  } else {
    console.log('✨ Không có bài tuyển dụng mới nào đạt chuẩn trong 7 ngày qua.');
  }

  console.log('🎉 Hoàn thành chu kỳ quét an toàn.');
}

run();

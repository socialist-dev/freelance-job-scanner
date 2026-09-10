export interface AIProcessedJob {
  isValidJob: boolean;       // TRUE nếu là khách tìm thuê
  isWithin7Days: boolean;    // TRUE nếu trong 7 ngày trở lại
  postedAgo: string;         // VD: "5 ngày trước", "2 giờ trước"
  categoryTag: string;       // Tag kỹ năng
  leadScore: string;         // Điểm tiềm năng
  jobTitle: string;          // Tiêu đề
  jobRequirements: string;   // Yêu cầu chi tiết
  budget: string;            // Ngân sách
  contact: string;           // Liên hệ của khách
}

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function analyzeJobWithGemini(rawContent: string, geminiKey: string, retries = 3): Promise<AIProcessedJob | null> {
  const MODEL = 'gemini-3.1-flash-lite';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${geminiKey}`;

  const prompt = `
Bạn là chuyên gia thẩm định và săn lùng job Freelance (Video Editor, Designer) từ MẠNG XÃ HỘI VÀ KHU VỰC BÌNH LUẬN (Threads, TikTok, YouTube, Facebook).
Hãy phân tích dữ liệu cào được dưới đây:

=== NỘI DUNG RAW (BAO GỒM CẢ BÌNH LUẬN) ===
${rawContent}
==========================================

HƯỚNG DẪN XỬ LÝ KHU VỰC BÌNH LUẬN (COMMENTS):
1. NHẬN DIỆN KHÁCH HÀNG:
   - Nếu trong bình luận có ai đó hỏi thuê (VD: "Ai nhận dựng video kiểu này không?", "Bác nào làm thumbnail giống video này ib mình nhé", "Cần tìm người edit video tương tự LH 09xx..."): ĐÂY LÀ JOB THẬT -> "isValidJob = true".
   - Nếu bình luận là freelancer tự ứng tuyển ("Em nhận edit giá rẻ...", "Ib em nhận làm...") -> BỎ QUA ("isValidJob = false").
2. THỜI GIAN (7 NGÀY): Đăng trong vòng 7 ngày trở lại -> "isWithin7Days = true".
3. THÔNG TIN LIÊN HỆ: Lấy đúng username / SĐT / Zalo của NGƯỜI CẦN THUÊ trong bài viết hoặc trong bình luận đó.
4. PHÂN LOẠI KỸ NĂNG: [TikTok / Reels], [CapCut], [YouTube Editor], [Premiere / AE], [Thumbnail / Banner], [2D / 3D Design].
5. CHẤM ĐIỂM (1 - 5 ⭐): Đánh giá độ chi tiết và tiềm năng chốt deal.
`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'OBJECT',
              properties: {
                isValidJob: { type: 'BOOLEAN' },
                isWithin7Days: { type: 'BOOLEAN' },
                postedAgo: { type: 'STRING' },
                categoryTag: { type: 'STRING' },
                leadScore: { type: 'STRING' },
                jobTitle: { type: 'STRING' },
                jobRequirements: { type: 'STRING' },
                budget: { type: 'STRING' },
                contact: { type: 'STRING' }
              },
              required: ['isValidJob', 'isWithin7Days', 'postedAgo', 'categoryTag', 'leadScore', 'jobTitle', 'jobRequirements', 'budget', 'contact']
            }
          }
        })
      });

      if (response.status === 503 || response.status === 429) {
        console.warn(`⚠️ Gemini API quá tải (Mã ${response.status}). Đang thử lại lần ${attempt}/${retries} sau ${attempt * 2}s...`);
        await sleep(attempt * 2000);
        continue;
      }

      if (!response.ok) return null;

      const data = (await response.json()) as any;
      const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      return jsonText ? JSON.parse(jsonText) : null;
    } catch (err) {
      if (attempt === retries) return null;
      await sleep(2000);
    }
  }
  return null;
}

// Hàm AI tự sinh 3 toán tử Google Dork mới nếu lần quét đầu quá ít kết quả
export async function generateAIDorks(geminiKey: string): Promise<string[]> {
  const MODEL = 'gemini-3.1-flash-lite';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${geminiKey}`;

  const prompt = `
Hãy tạo 3 câu Google Dorking tiếng Việt nâng cao và độc đáo nhất để săn lùng các bài đăng TUYỂN DỤNG FREELANCE VIDEO EDITOR & DESIGNER trên toàn mạng xã hội/diễn đàn/bình luận.
Trả về danh sách dạng mảng JSON gồm 3 chuỗi query.
Ví dụ format: ["query 1", "query 2", "query 3"]
`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    });
    const data = (await res.json()) as any;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return text ? JSON.parse(text) : [];
  } catch {
    return [];
  }
}

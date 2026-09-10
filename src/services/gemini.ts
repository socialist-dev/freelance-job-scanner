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
Bạn là chuyên gia thẩm định bài đăng tìm Freelancer (Video Editor, Designer).
Phân tích nội dung cào từ mạng xã hội/bình luận dưới đây:

=== NỘI DUNG RAW ===
${rawContent}
====================

TIÊU CHÍ BẮT BUỘC:
1. LỌC NGƯỜI THUÊ: "isValidJob = true" CHỈ KHI bài viết/bình luận là từ KHÁCH HÀNG/RECRUITER ĐANG TÌM THUÊ NGƯỜI (kể cả khách để lại bình luận nhờ người làm). Nếu là freelancer tự quảng cáo nhận việc hoặc bài spam -> isValidJob = false.
2. KHUNG GIỜ 7 NGÀY: "isWithin7Days = true" nếu bài viết được đăng trong vòng 7 ngày trở lại (ví dụ: "5 days ago", "6 ngày trước", "vừa xong", "3 giờ trước" đều LẤY). Nếu bài quá 7 ngày (VD: "2 tuần trước", "1 month ago", bài từ năm ngoái) -> isWithin7Days = false.
3. PHÂN LOẠI KỸ NĂNG: [CapCut / TikTok / Reels], [Premiere / After Effects], [YouTube Editor], [Photoshop / Banner], [2D / 3D Animation], [Thumbnail Design].
4. ĐÁNH GIÁ TIỀM NĂNG (1 đến 5 sao kèm lý do): 5/5 ⭐ (Rõ brief, có tiền cụ thể, có contact), 3-4/5 ⭐ (Nhu cầu rõ nhưng bảo inbox/thương lượng), 1-2/5 ⭐ (Mơ hồ/ít tin cậy).
5. LIÊN HỆ: Trích xuất SĐT/Zalo/Link của chính NGƯỜI CẦN THUÊ.
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

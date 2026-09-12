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

  // Lấy ngày hiện tại chuẩn theo giờ Việt Nam
  const now = new Date();
  const todayVN = now.toLocaleDateString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  const prompt = `
Bạn là chuyên gia thẩm định và săn lùng job Freelance (Video Editor, Designer) từ mạng xã hội, diễn đàn và bình luận.
HÔM NAY LÀ NGÀY: ${todayVN} (Giờ Việt Nam).

Hãy phân tích nội dung cào được dưới đây:

=== NỘI DUNG RAW ===
${rawContent}
====================

TIÊU CHÍ BẮT BUỘC ĐẶC BIỆT:
1. NHẬN DIỆN CẢ NHU CẦU TRỰC TIẾP LẪN NHU CẦU NGẦM (VĂN NÓI TỰ NHIÊN):
   - Chấp nhận cả những bài đăng hỏi han nhờ làm theo mẫu (VD: "Hổng biết có ai edit được kiểu này ko", "Ai làm được video như này ib mình", "Có bác nào nhận làm dạng này ko ạ..."). ĐÂY VẪN LÀ KHÁCH HÀNG TIỀM NĂNG -> Đánh dấu "isValidJob = true".
   - CHỈ BỎ QUA ("isValidJob = false") nếu là Freelancer tự đăng bài quảng cáo chào dịch vụ của mình (VD: "Mình nhận edit giá rẻ...", "Ai cần làm clip ib em...").
2. LỌC THỜI GIAN (7 NGÀY):
   - So sánh trực tiếp ngày của bài viết với ngày HÔM NAY (${todayVN}).
   - Nếu đăng trong vòng 7 ngày gần nhất ("vừa xong", "vài giờ trước", "1-6 ngày trước", hoặc ngày cách hôm nay <= 7 ngày) -> "isWithin7Days = true".
   - Nếu bài viết có ngày cụ thể cách đây hơn 7 ngày (từ tháng trước, năm ngoái, "13 Tháng 8", "14/03/2025", "1 month ago", "2 tuần trước"...) -> BẮT BUỘC ĐẶT "isWithin7Days = false".
3. PHÂN LOẠI KỸ NĂNG: [Edit Theo Mẫu / TikTok Trend], [CapCut / Reels], [Premiere / After Effects], [YouTube Editor], [Thumbnail / Banner], [2D / 3D Animation].
4. ĐÁNH GIÁ TIỀM NĂNG:
   - Nếu là bài hỏi làm theo mẫu/trend: Ghi chú "4/5 ⭐ (Cần chủ động inbox gửi sản phẩm mẫu tương tự để chốt deal)".
5. LIÊN HỆ & YÊU CẦU: Tóm tắt chính xác phong cách/video mà khách đang muốn làm theo.
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
        const waitTime = attempt * 5000;
        console.warn(`⚠️ Gemini API quá tải (Mã ${response.status}). Đang thử lại lần ${attempt}/${retries} sau ${waitTime / 1000}s...`);
        await sleep(waitTime);
        continue;
      }

      if (!response.ok) return null;

      const data = (await response.json()) as any;
      const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!jsonText) return null;

      const result = JSON.parse(jsonText) as AIProcessedJob;

      // 🛡️ Lớp lọc code bổ sung: Tự động loại bỏ nếu chuỗi thời gian dính tháng cũ/năm cũ
      const lower = (result.postedAgo || '').toLowerCase();
      const currentYear = now.getFullYear().toString();
      if (
        (lower.includes('tháng') && !lower.includes('trước')) ||
        lower.includes('month') ||
        lower.includes('tuần trước') ||
        lower.includes('weeks ago') ||
        (lower.match(/202[0-5]/) && !lower.includes(currentYear))
      ) {
        result.isWithin7Days = false;
      }

      return result;
    } catch (err) {
      if (attempt === retries) return null;
      await sleep(5000);
    }
  }
  return null;
}

// Hàm AI tự sinh 3 toán tử Google Dork mới nếu lần quét đầu quá ít kết quả
export async function generateAIDorks(geminiKey: string): Promise<string[]> {
  const MODEL = 'gemini-3.1-flash-lite';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${geminiKey}`;

  const prompt = `
Hãy tạo 3 câu Google Dorking tiếng Việt cực kỳ linh hoạt, sử dụng VĂN NÓI TỰ NHIÊN, TEEN-CODE hoặc CÂU HỎI NHỜ VẢ để săn các khách hàng đang muốn tìm người edit video/design trên Threads, Facebook, TikTok.
Ví dụ phong cách:
- ("hổng biết ai" OR "có ai nhận") ("edit kiểu này" OR "làm clip dạng này")
- ("ai biết làm video" OR "ai dựng được") ("giống vầy" OR "như này hông")

Trả về danh sách dạng mảng JSON gồm 3 chuỗi query.
Format: ["query 1", "query 2", "query 3"]
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

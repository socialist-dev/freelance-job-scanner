export interface AIProcessedJob {
  isValidJob: boolean;       // TRUE nếu là khách tìm người thuê, FALSE nếu là spam/freelancer xin việc
  isWithin24h: boolean;      // TRUE nếu đăng trong 24h
  postedAgo: string;         // VD: "2 giờ trước", "5 ngày trước"
  categoryTag: string;       // VD: "[CapCut / Reels]", "[Premiere / 2D]", "[Banner / Photoshop]"
  leadScore: string;         // VD: "5/5 ⭐ (Brief chi tiết, có ngân sách rõ ràng)"
  jobTitle: string;          // Tiêu đề ngắn gọn
  jobRequirements: string;   // Tóm tắt brief yêu cầu thực tế
  budget: string;            // Ngân sách
  contact: string;           // Liên hệ của khách (bỏ qua comment dạo)
}

export async function analyzeJobWithGemini(rawContent: string, geminiKey: string): Promise<AIProcessedJob | null> {
  // Đổi sang model Gemini 3.1 Flash Lite mới nhất
  const MODEL = 'gemini-3.1-flash-lite';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${geminiKey}`;

  const prompt = `
Bạn là chuyên gia thẩm định và chọn lọc job Freelance (Video Editing, Design, Graphic).
Nhiệm vụ của bạn là phân tích dữ liệu cào được từ mạng xã hội dưới đây:

=== NỘI DUNG RAW ===
${rawContent}
====================

TIÊU CHÍ BẮT BUỘC:
1. LỌC NGƯỜI DÙNG: "isValidJob = true" CHỈ KHI người đăng bài là KHÁCH CẦN THUÊ / TUYỂN DỤNG. Nếu là freelancer chào dịch vụ ("nhận edit", "tìm job...") hoặc bài spam -> isValidJob = false.
2. LỌC THỜI GIAN 24H: Kiểm tra kỹ thời gian đăng. Nếu quá 24h (ví dụ "5 days ago", "3 ngày trước", "tháng trước") -> isWithin24h = false.
3. PHÂN LOẠI KỸ NĂNG (categoryTag): Chọn 1 hoặc nhiều tag phù hợp: [CapCut / TikTok / Reels], [Premiere / After Effects], [YouTube Editor], [Photoshop / Banner], [2D / 3D Animation], [Thumbnail Design].
4. CHẤM ĐIỂM TIỀM NĂNG (leadScore từ 1 đến 5 sao kèm lý do ngắn):
   - 5/5 ⭐: Brief cực rõ, có ngân sách cụ thể, có số Zalo/SĐT/Email rõ ràng.
   - 3-4/5 ⭐: Nhu cầu rõ ràng nhưng ngân sách thỏa thuận / chỉ bảo inbox.
   - 1-2/5 ⭐: Tin mơ hồ hoặc có dấu hiệu spam.
5. LIÊN HỆ & YÊU CẦU: Trích xuất SĐT/Zalo/FB của chính NGƯỜI ĐĂNG BÀI (bỏ qua hoàn toàn số của những người vào bình luận dạo xin việc). Tóm tắt yêu cầu brief gọn gàng, súc tích.
`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              isValidJob: { type: 'BOOLEAN' },
              isWithin24h: { type: 'BOOLEAN' },
              postedAgo: { type: 'STRING' },
              categoryTag: { type: 'STRING' },
              leadScore: { type: 'STRING' },
              jobTitle: { type: 'STRING' },
              jobRequirements: { type: 'STRING' },
              budget: { type: 'STRING' },
              contact: { type: 'STRING' }
            },
            required: [
              'isValidJob',
              'isWithin24h',
              'postedAgo',
              'categoryTag',
              'leadScore',
              'jobTitle',
              'jobRequirements',
              'budget',
              'contact'
            ]
          }
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Lỗi phản hồi từ Gemini API:', errText);
      return null;
    }

    const data = (await response.json()) as any;
    const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!jsonText) return null;

    return JSON.parse(jsonText) as AIProcessedJob;
  } catch (err) {
    console.error('Lỗi khi gọi Gemini API:', err);
    return null;
  }
}

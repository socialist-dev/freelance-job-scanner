import { GoogleGenAI, Type } from '@google/genai';

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
  const ai = new GoogleGenAI({ apiKey: geminiKey });

  const prompt = `
Bạn là chuyên gia thẩm định và chọn lọc job Freelance (Video Editing, Design, Graphic).
Nhiệm vụ của bạn là phân tích dữ liệu cào được từ mạng xã hội dưới đây:

=== NỘI DUNG RAW ===
${rawContent}
====================

TIÊU CHÍ BẮT BUỘC:
1. LỌC NGƯỜI DÙNG: "isValidJob = true" CHỈ KHI người đăng bài là KHÁCH CẦN THUÊ / TUYỂN DỤNG. Nếu là freelancer chào dịch vụ ("nhận edit", "tìm job...") hoặc spam -> isValidJob = false.
2. LỌC THỜI GIAN 24H: Kiểm tra kỹ thời gian đăng. Nếu quá 24h (ví dụ "5 days ago", "3 ngày trước", "tháng trước") -> isWithin24h = false.
3. PHÂN LOẠI KỸ NĂNG (categoryTag): Chọn 1 hoặc nhiều tag phù hợp: [CapCut / TikTok / Reels], [Premiere / After Effects], [YouTube Editor], [Photoshop / Banner], [2D / 3D Animation], [Thumbnail Design].
4. CHẤM ĐIỂM TIỀM NĂNG (leadScore từ 1 đến 5 sao kèm lý do ngắn):
   - 5/5 ⭐: Brief cực rõ, có ngân sách cụ thể, có số Zalo/SĐT/Email rõ ràng.
   - 3-4/5 ⭐: Nhu cầu rõ ràng nhưng ngân sách thỏa thuận / chỉ bảo inbox.
   - 1-2/5 ⭐: Tin mơ hồ hoặc có dấu hiệu spam.
5. LIÊN HỆ & YÊU CẦU: Trích xuất SĐT/Zalo/FB của chính NGƯỜI ĐĂNG BÀI (bỏ qua hoàn toàn số của những người vào bình luận dạo xin việc). Tóm tắt yêu cầu brief gọn gàng, súc tích.
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isValidJob: { type: Type.BOOLEAN },
            isWithin24h: { type: Type.BOOLEAN },
            postedAgo: { type: Type.STRING },
            categoryTag: { type: Type.STRING },
            leadScore: { type: Type.STRING },
            jobTitle: { type: Type.STRING },
            jobRequirements: { type: Type.STRING },
            budget: { type: Type.STRING },
            contact: { type: Type.STRING }
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
    });

    if (!response.text) return null;
    return JSON.parse(response.text) as AIProcessedJob;
  } catch (err) {
    console.error('Lỗi khi gọi Gemini AI:', err);
    return null;
  }
}

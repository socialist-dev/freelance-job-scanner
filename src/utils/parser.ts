export interface JobItem {
  scanTime: string;      // Thời gian quét
  platform: string;      // Nền tảng
  postedAgo: string;     // Bài đăng cách đây bao lâu (MỚI)
  title: string;         // Tiêu đề
  requirements: string;  // Nội dung & Yêu cầu công việc đã làm sạch
  budget: string;        // Ngân sách
  contact: string;       // Liên hệ
  url: string;           // Link bài gốc
}

export function parsePlatform(url: string): string {
  if (url.includes('threads.net')) return 'Threads';
  if (url.includes('facebook.com')) return 'Facebook';
  if (url.includes('x.com') || url.includes('twitter.com')) return 'X';
  return 'Khác';
}

// Làm sạch toàn bộ cú pháp Markdown rác từ Jina
export function cleanRawContent(raw: string): string {
  return raw
    .replace(/!\[.*?\]\(.*?\)/g, '')            // Xóa ảnh markdown ![Image](url)
    .replace(/\[.*?\]\(.*?\)/g, '$1')           // Xóa link [text](url) -> giữ lại text
    .replace(/URL Source:.*?\n/g, '')           // Xóa header Jina
    .replace(/Description:.*?\n/g, '')          // Xóa description rác
    .replace(/Ảnh đại diện của.*?\n/g, '')      // Xóa mô tả ảnh Threads
    .replace(/\d+([,\.]\d+)?\s?[kK]?\s?người theo dõi/g, '') // Xóa số follower
    .replace(/(\n|\r)+/g, ' ')                  // Gộp dòng thừa
    .replace(/\s{2,}/g, ' ')                    // Xóa khoảng trắng thừa
    .trim();
}

// Bóc tách thời gian và kiểm tra xem có trong vòng 24h không
export function extractTimeAgoAndValidate(rawSection: string): { isWithin24h: boolean; postedAgo: string } {
  // 1. Kiểm tra nếu có dạng giờ/phút tương đối (VD: 2 giờ trước, 45 phút trước, 3h ago)
  const relativeMatch = rawSection.match(/(\d+\s*(giờ|phút|tiếng|h|m|hours?|mins?)\s*(trước|ago)?)/i);
  if (relativeMatch) {
    return { isWithin24h: true, postedAgo: relativeMatch[0] };
  }

  // 2. Kiểm tra nếu có Date: Month Day, Year
  const dateMatch = rawSection.match(/Date:\s*([A-Za-z]+\s+\d{1,2},\s+\d{4})/i);
  if (dateMatch) {
    const postDate = new Date(dateMatch[1]);
    const now = new Date();
    const diffHours = (now.getTime() - postDate.getTime()) / (1000 * 60 * 60);

    if (diffHours <= 24 && diffHours >= 0) {
      return { isWithin24h: true, postedAgo: `${Math.round(diffHours)} giờ trước` };
    }
    // Nếu quá 24h -> loại bỏ
    return { isWithin24h: false, postedAgo: 'Quá 24h' };
  }

  // Mặc định các bài mới index nếu không rõ ngày -> ghi nhận Gần đây
  return { isWithin24h: true, postedAgo: 'Mới đăng gần đây' };
}

export function extractBudget(text: string): string {
  const budgetRegex = /(\d+[\.,]?\d*\s?(k|triệu|tr|vnd|k|\$)|deal|thỏa thuận|trao đổi)/i;
  const match = text.match(budgetRegex);
  return match ? match[0] : 'Thỏa thuận';
}

export function extractContact(text: string): string {
  const phone = text.match(/(0[3|5|7|8|9][0-9]{8})/g);
  const email = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g);
  const contacts = [...(phone || []), ...(email || [])];
  return contacts.length > 0 ? contacts.join(', ') : 'Direct Message (DM / Inbox)';
}

export const BASE_DORK_QUERIES = [
  // 1. Dạng hỏi người làm theo Mẫu / Style / Trend (Như trong ảnh của bạn)
  '("ai edit được" OR "ai làm được" OR "ai dựng được" OR "ai design được") ("kiểu này" OR "dạng này" OR "như này" OR "giống vầy" OR "style này")',
  
  // 2. Dạng văn nói hỏi han, nhờ vả tự nhiên
  '("hổng biết có ai" OR "không biết có ai" OR "có bác nào" OR "có ai nhận") ("edit" OR "dựng clip" OR "làm video" OR "design") ("không ạ" OR "ko ạ" OR "hông" OR "giùm" OR "hộ")',

  // 3. Dạng hỏi tìm người làm có trả phí / báo giá
  '("ai nhận làm" OR "ai nhận edit" OR "ai nhận dựng") ("video này" OR "clip này" OR "ảnh này") (intext:"inbox" OR intext:"báo giá" OR intext:"có phí" OR intext:"ib")',

  // 4. Quét riêng Threads & Facebook Group với từ khóa tự nhiên
  'site:threads.net ("ai nhận edit" OR "ai làm được video" OR "ai edit giùm" OR "cần người làm clip")',
  'site:facebook.com/groups ("hổng biết có ai" OR "ai nhận làm" OR "ai edit được") ("kiểu này" OR "như này" OR "dạng này")',

  // 5. Quét YouTube & TikTok (Săn người hỏi làm hiệu ứng/trend)
  'site:tiktok.com ("ai edit được" OR "ai biết làm video kiểu này" OR "xin in4 người edit")',
  'site:youtube.com ("ai nhận edit video" OR "thuê người edit clip này" OR "hỏi người dựng")'
];

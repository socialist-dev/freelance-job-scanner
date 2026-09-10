export const BASE_DORK_QUERIES = [
  // 1. Quét mở rộng toàn mạng (Không giới hạn site)
  '("cần tìm editor" OR "tuyển freelance video" OR "cần người edit video" OR "tìm người edit capcut") (intext:"inbox" OR intext:"zalo" OR intext:"liên hệ")',
  '("cần designer gấp" OR "tìm thiết kế banner" OR "tuyển người làm thumbnail" OR "cần thuê thiết kế 2d")',

  // 2. Dò trong phần Bình luận / Thảo luận (Threads, FB, Diễn đàn)
  'site:threads.net ("bác nào nhận edit" OR "ai nhận làm video" OR "ai design được" OR "cần người dựng clip")',
  'site:facebook.com/groups ("cần editor" OR "tìm designer" OR "job edit video") (intext:"comment" OR intext:"ib" OR intext:"zalo")',

  // 3. Quét các nền tảng khác (TikTok, LinkedIn, X, Diễn đàn sáng tạo)
  'site:tiktok.com ("tìm editor" OR "tuyển edit video" OR "cần người edit reels")',
  'site:linkedin.com/posts ("hiring video editor" OR "tuyển thiết kế freelance" OR "cần editor tiktok")'
];

export const BASE_DORK_QUERIES = [
  // 1. Bình luận & Bài đăng trên TikTok
  'site:tiktok.com/@* ("cần tìm editor" OR "tuyển edit video" OR "ai nhận edit" OR "tìm người dựng video")',
  'site:tiktok.com ("tìm designer" OR "ai làm thumbnail" OR "cần người edit capcut")',

  // 2. Bình luận & Bài đăng trên YouTube (Mỏ vàng Creator tìm Editor)
  'site:youtube.com ("tìm editor" OR "tuyển edit video" OR "cần người edit video" OR "hiring editor") (intext:"liên hệ" OR intext:"zalo" OR intext:"email")',
  'site:youtube.com/post ("tuyển editor" OR "cần tìm bạn edit" OR "tìm designer làm thumbnail")',

  // 3. Săn lùng câu hỏi / trao đổi tuyển dụng trong Bình luận Threads & Facebook
  'site:threads.net ("bác nào nhận edit" OR "ai nhận làm video" OR "có ai nhận design" OR "cần thuê người dựng")',
  'site:threads.net ("inbox giá" OR "báo giá giúp mình" OR "ai rảnh nhận job")',
  'site:facebook.com/groups ("ai nhận edit" OR "cần người làm video gấp" OR "bác nào design được") (intext:"comment" OR intext:"inbox" OR intext:"zalo")',

  // 4. Quét tự do toàn mạng (Kể cả diễn đàn Voz, Spiderum, blog)
  '("cần tìm người edit" OR "tìm freelance design") (intext:"bình luận bên dưới" OR intext:"để lại liên hệ" OR intext:"inbox mình")'
];

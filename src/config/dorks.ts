export const DORK_QUERIES = [
  // Threads: Bắt buộc URL phải là bài đăng (/post/) và chứa từ khóa tuyển dụng thực tế
  'site:threads.net/*/post/* ("cần tìm editor" OR "tìm người edit video" OR "cần editor gấp" OR "tuyển edit capcut")',
  'site:threads.net/*/post/* ("tìm designer" OR "cần thiết kế banner" OR "cần người làm thumbnail" OR "tuyển freelance design")',
  'site:threads.net/*/post/* ("nhận edit video" OR "tìm freelancer edit" OR "cần thuê edit" OR "tìm người dựng clip")',

  // Facebook: Chỉ quét vào các nhóm tuyển dụng công khai
  'site:facebook.com/groups/* ("cần tìm editor" OR "tìm người edit video" OR "tìm designer freelance" OR "job edit video")',
  
  // X (Twitter): Chỉ quét các tweet tuyển dụng
  'site:x.com/*/status/* ("cần tìm editor" OR "tuyển editor" OR "cần thiết kế" OR "hiring video editor")'
];

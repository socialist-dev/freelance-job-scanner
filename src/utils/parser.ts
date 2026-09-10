export interface JobItem {
  time: string;
  platform: string;
  title: string;
  content: string;
  budget: string;
  contact: string;
  url: string;
}

export function parsePlatform(url: string): string {
  if (url.includes('threads.net')) return 'Threads';
  if (url.includes('facebook.com')) return 'Facebook';
  if (url.includes('x.com') || url.includes('twitter.com')) return 'X / Twitter';
  return 'Web / Khác';
}

export function extractBudget(text: string): string {
  const budgetRegex = /(\d+[\.,]?\d*k|\d+[\.,]?\d*\s?(triệu|tr|vnd|k|\$)|thỏa thuận|deal)/i;
  const match = text.match(budgetRegex);
  return match ? match[0] : 'Thỏa thuận';
}

export function extractContact(text: string): string {
  const phoneRegex = /(0[3|5|7|8|9][0-9]{8})/g;
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  
  const phones = text.match(phoneRegex) || [];
  const emails = text.match(emailRegex) || [];
  
  const contacts = [...phones, ...emails];
  return contacts.length > 0 ? contacts.join(', ') : 'Direct Message / Inbox';
}

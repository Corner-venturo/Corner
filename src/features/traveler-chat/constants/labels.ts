export const LABELS = {
  // TravelerChatCenter
  travelerChat: '旅伴通訊',
  tourCount: (count: number) => `${count} 團`,
  travelerCount: (count: number) => `${count} 位旅伴`,

  // ConversationChat
  system: '系統',
  staff: '員工',
  traveler: '旅伴',
  selectConversation: '選擇一個對話開始聊天',
  announcement: '公告',
  customerService: '客服',
  announcementPlaceholder: '發送公告給所有旅伴...',
  replyPlaceholder: '回覆旅伴訊息...',
  uploadImage: '上傳圖片',
  uploadFile: '上傳檔案',

  // TourList
  departed: '已出發',
  departToday: '今天出發',
  departTomorrow: '明天出發',
  departInDays: (days: number) => `${days} 天後出發`,
  noConversations: '尚無團對話',
  closeTravelerChat: '關閉旅伴通訊',
  openTravelerChat: '開啟旅伴通訊',
  openedAt: '開啟於',
  notOpenYet: '尚未開啟',
  cannotSendNotOpen: '對話尚未開啟，無法發送訊息',
}

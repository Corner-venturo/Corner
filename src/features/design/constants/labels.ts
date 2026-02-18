// design/types.ts 的中文標籤
export const DESIGN_TYPE_LABELS = {
  手冊A5: '手冊 A5',
  直式148x210: '148 x 210 mm (直式)',
  手冊A4: '手冊 A4',
  直式210x297: '210 x 297 mm (直式)',
  IG正方形: 'IG 正方形',
  IG直式: 'IG 直式',
  IG限時動態: 'IG 限時動態',
  橫幅布條: '橫幅布條',
  方形廣告: '方形廣告',
}

export const DESIGN_CATEGORY_LABELS = {
  手冊: '手冊',
  手冊傳單: '手冊、傳單',
  社群媒體: '社群媒體',
  廣告橫幅: '廣告橫幅',
  網站廣告布條: '網站廣告、布條',
}

export const DESIGN_STATUS_LABELS = {
  草稿: '草稿',
  已完成: '已完成',
}

// design components 的中文標籤
export const DESIGN_COMPONENT_LABELS = {
  請選擇旅遊團: '請選擇旅遊團',
  設計已建立: '設計已建立',
  建立設計失敗: '建立設計失敗',
  此設計缺少關聯的旅遊團: '此設計缺少關聯的旅遊團',
  已複製設計: '已複製設計',
  複製失敗請稍後再試: '複製失敗，請稍後再試',
  已刪除設計: '已刪除設計',
  刪除失敗請稍後再試: '刪除失敗，請稍後再試',
}

export const LABELS = {
  // CreateDesignDialog
  newDesign: '新設計',
  addDesign: '新增設計',
  creating: '建立中...',
  createDesign: '建立設計',

  // DesignList
  tourName: '團名',
  noTourName: '無團名',
  designType: '設計類型',
  status: '狀態',
  completed: '已完成',
  draft: '草稿',
  createdDate: '建立日期',
  loadFailed: '載入失敗',
  noDesigns: '尚無設計',
  noDesignsHint1: '點擊右上角',
  noDesignsHint2: '新增設計',
  noDesignsHint3: '開始',

  // DesignPage
  deleteConfirm: (name: string) => `確定要刪除「${name}」嗎？此操作無法復原。`,
  design: '設計',
  home: '首頁',

  // TourItinerarySelector
  loading: '載入中...',
  selectTour: '請選擇旅遊團',
  noName: '無名稱',
  selectTourFirst: '請先選擇旅遊團',
  noItinerary: '此團沒有行程',
  selectItinerary: '選擇行程',
  relatedData: '關聯資料',
  cancel: '取消',
  edit: '編輯',
  delete: '刪除',
  untitledDesign: '未命名設計',

  COPY: '複製',
}

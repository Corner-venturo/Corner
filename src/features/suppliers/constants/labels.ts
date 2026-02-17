export const LABELS = {
  // SuppliersDialog
  editSupplier: '編輯供應商',
  addSupplier: '新增供應商',
  editSubtitle: '修改供應商資訊',
  addSubtitle: '請填寫供應商基本資訊',
  saveChanges: '儲存變更',
  supplierName: '供應商名稱',
  supplierNamePlaceholder: '輸入供應商名稱',
  bankName: '銀行名稱',
  bankNamePlaceholder: '例如：國泰世華銀行',
  bankAccount: '銀行帳號',
  bankAccountPlaceholder: '請輸入完整帳號',
  notes: '備註',
  notesPlaceholder: '供應商備註資訊（選填）',

  // SuppliersPage
  supplierManagement: '供應商管理',
  home: '首頁',
  databaseManagement: '資料庫管理',
  searchPlaceholder: '搜尋供應商名稱或銀行資訊...',
  noSuppliers: '尚無供應商資料',
  addFirst: '新增第一筆供應商',

  // SuppliersList
  supplierCode: '供應商編號',
  type: '類型',
  edit: '編輯',
  delete: '刪除',
  deleteSupplier: '刪除供應商',
}


// Supplier types
export const SUPPLIER_TYPE_LABELS = {
  HOTEL: '飯店',
  RESTAURANT: '餐廳',
  TRANSPORTATION: '交通',
  ATTRACTION: '景點',
  GUIDE: '導遊',
  TRAVEL_AGENCY: '旅行社',
  TICKETING: '票務',
  EMPLOYEE: '員工',
  OTHER: '其他',
}

// SuppliersPage toast messages
export const SUPPLIERS_PAGE_LABELS = {
  DELETE_CONFIRM: (name: string) => `確定要刪除供應商「${name}」嗎？`,
  DELETE_SUCCESS: '供應商已刪除',
  DELETE_FAILED: '刪除失敗，請稍後再試',
  UPDATE_SUCCESS: '供應商更新成功',
  CREATE_SUCCESS: '供應商建立成功',
  SAVE_FAILED: '儲存失敗，請稍後再試',
}

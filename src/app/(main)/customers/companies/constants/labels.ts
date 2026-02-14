export const COMPANY_LABELS = {
  // Page
  PAGE_TITLE: '企業客戶管理',
  ADD_COMPANY: '新增企業',
  SEARCH_PLACEHOLDER: '搜尋企業名稱、統編或聯絡資訊...',

  // CRUD Messages
  UPDATE_SUCCESS: '企業客戶更新成功',
  UPDATE_FAILED: '更新企業客戶失敗',
  CREATE_SUCCESS: '企業客戶新增成功',
  CREATE_FAILED: '新增企業客戶失敗',
  DELETE_SUCCESS: '企業客戶刪除成功',
  DELETE_FAILED: '刪除企業客戶失敗',
  CHECK_CONTACTS_FAILED: '檢查聯絡人時發生錯誤',

  // Delete Confirmation
  DELETE_TITLE: '刪除企業客戶',
  DELETE_CONFIRM: '確定刪除',
  DELETE_CANCEL: '取消',
  DELETE_WITH_CONTACTS: (count: number, contactInfo: string, companyName: string) =>
    `此企業有 ${count} 位關聯的聯絡人（${contactInfo}），刪除企業將同時刪除這些聯絡人。\n\n確定要刪除企業「${companyName}」嗎？`,
  DELETE_SIMPLE: (companyName: string) =>
    `確定要刪除企業「${companyName}」嗎？`,
  CONTACTS_OVERFLOW: (names: string, count: number) =>
    `${names}... 等 ${count} 位聯絡人`,
} as const

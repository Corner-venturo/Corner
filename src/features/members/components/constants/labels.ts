export const MEMBERS_LABELS = {
  ADD_6565: '上傳護照以批次新增成員',
  LABEL_809: '人工檢查護照資訊',
  PROCESSING_6696: '處理檔案中...',
  UPLOADING_9146: '點擊上傳',
  LABEL_591: '或拖曳檔案',

  NOT_FOUND_7442: '沒有護照照片',
  LABEL_883: '姓名：',
  LABEL_8345: '英文姓名：',
  LABEL_9593: '護照號碼：',
  LABEL_3311: '護照效期：',
  LABEL_94: '生日：',
  LABEL_8424: '性別：',

  LABEL_658: '姓名',
  LABEL_841: '英文拼音',
  LABEL_8408: '身分證',
  LABEL_5147: '護照號碼',
  LABEL_8658: '生日',
  LABEL_2195: '性別',
  SELECT_4661: '點擊列即可選擇該顧客資料',
  LABEL_5836: '取消，手動輸入',

  // MemberInfoCard
  的護照: '的護照',
  男: '男',
  女: '女',

  // MemberDocuments
  重要提醒: '重要提醒',
  OCR辨識待驗證提示: 'OCR 辨識的資料會自動標記為',
  待驗證: '待驗證',
  支援所有國家護照: '支援所有國家護照（TWN、USA、JPN 等）',
  支援格式: '支援 JPG, PNG, PDF（可多選）',
  已選擇N張圖片: (count: number) => `已選擇 ${count} 張圖片：`,
  從PDF轉換: '(從 PDF 轉換)',
  辨識中: '辨識中...',
  辨識並建立N位成員: (count: number) => `辨識並建立 ${count} 位成員`,

  // MemberPayments
  找到N位相似顧客: (count: number, name: string) => `找到 ${count} 位相似顧客「${name}」`,
  找到N位相同身分證: (count: number, idNumber: string) =>
    `找到 ${count} 位相同身分證「${idNumber}」`,

  // passport-utils
  壓縮失敗: '壓縮失敗',
}

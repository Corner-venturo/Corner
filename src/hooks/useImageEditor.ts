/**
 * Image Editor Hook
 * 管理圖片編輯功能：縮放、平移、旋轉、翻轉、裁剪
 *
 * 共用於：
 * - CustomerVerifyDialog (顧客護照驗證)
 * - OrderMembersExpandable (訂單成員編輯)
 *
 * @deprecated - 此檔案已拆分為模組化結構，請改用 './image-editor'
 * 為保持向後相容性暫時保留此檔案
 */

export { useImageEditor } from './image-editor'
export type { ImageTransformState, ImageCropState } from './image-editor'

import { format, isToday, isYesterday } from 'date-fns'
import type { MessageAttachment } from '@/stores/workspace-store'
import { getPublicUrlFromStorage } from '@/services/storage'
import { STORAGE_BUCKET, MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from './constants'

export const formatMessageTime = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return ''

  if (isToday(date)) {
    return format(date, 'HH:mm')
  } else if (isYesterday(date)) {
    return `昨天 ${format(date, 'HH:mm')}`
  } else {
    return format(date, 'MM/dd HH:mm')
  }
}

export const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export const validateFile = (file: File): { valid: boolean; error?: string } => {
  // 檢查檔案大小
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `檔案 "${file.name}" 超過 10 MB 限制 (${formatFileSize(file.size)})`,
    }
  }

  // 檢查檔案類型
  const isValidType = Object.keys(ALLOWED_FILE_TYPES).some(type => {
    if (type.endsWith('/*')) {
      return file.type.startsWith(type.replace('/*', '/'))
    }
    return file.type === type
  })

  if (!isValidType) {
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    const isValidExtension = Object.values(ALLOWED_FILE_TYPES).flat().includes(fileExtension)

    if (!isValidExtension) {
      return {
        valid: false,
        error: `不支援的檔案格式 "${file.name}" (僅支援圖片、PDF、Word、Excel、文字檔)`,
      }
    }
  }

  return { valid: true }
}

export const resolveAttachmentUrl = (attachment: MessageAttachment) => {
  if (attachment.publicUrl) return attachment.publicUrl
  if (attachment.url) return attachment.url
  if (attachment.path) {
    return getPublicUrlFromStorage(attachment.path, STORAGE_BUCKET)
  }
  return ''
}

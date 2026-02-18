// Utility functions for workspace stores
import { v4 as uuidv4 } from 'uuid'
import type { MessageAttachment, RawMessage, Message } from './types'

export const ensureMessageAttachments = (attachments: unknown): MessageAttachment[] => {
  if (!Array.isArray(attachments)) {
    return []
  }

  return attachments.map(item => {
    const attachment = item as Partial<MessageAttachment> & Record<string, unknown>

    const path =
      typeof attachment.path === 'string'
        ? attachment.path
        : typeof attachment.url === 'string'
          ? String(attachment.url)
          : ''

    const fileName =
      typeof attachment.fileName === 'string'
        ? attachment.fileName
        : typeof attachment.name === 'string'
          ? attachment.name
          : 'Untitled'

    const mimeType =
      typeof attachment.mimeType === 'string'
        ? attachment.mimeType
        : typeof attachment.fileType === 'string'
          ? attachment.fileType
          : typeof attachment.type === 'string'
            ? attachment.type
            : 'application/octet-stream'

    const fileSize =
      typeof attachment.fileSize === 'number'
        ? attachment.fileSize
        : typeof attachment.size === 'number'
          ? attachment.size
          : 0

    const publicUrl =
      typeof attachment.publicUrl === 'string'
        ? attachment.publicUrl
        : typeof attachment.url === 'string'
          ? String(attachment.url)
          : ''

    const id =
      typeof attachment.id === 'string' && attachment.id.length > 0
        ? attachment.id
        : path || `${fileName}-${fileSize}-${mimeType}` || uuidv4()

    return {
      id,
      fileName,
      fileSize,
      mimeType,
      path,
      publicUrl,
      name: attachment.name,
      url: attachment.url,
      size: attachment.size,
      type: attachment.type,
      fileType: attachment.fileType,
    }
  })
}

export const normalizeMessage = (message: RawMessage): Message => ({
  ...message,
  created_at: message.created_at || new Date().toISOString(),
  attachments: ensureMessageAttachments(message.attachments),
})

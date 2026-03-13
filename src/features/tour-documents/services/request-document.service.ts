/**
 * Request Document Service
 * 需求單文件存取層（支援多版本）
 */

import { supabase } from '@/lib/supabase/client'
import type { RequestDocument, CreateRequestDocumentInput } from '@/types/tour-documents.types'

/**
 * 取得需求單的所有文件（按版本排序）
 */
export async function getRequestDocuments(requestId: string): Promise<RequestDocument[]> {
  const { data, error } = await supabase
    .from('request_documents')
    .select('*')
    .eq('request_id', requestId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * 建立文件（新版本）
 */
export async function createRequestDocument(
  input: CreateRequestDocumentInput,
  workspaceId: string,
  userId: string
): Promise<RequestDocument> {
  const { data, error } = await supabase
    .from('request_documents')
    .insert({
      workspace_id: workspaceId,
      request_id: input.request_id,
      document_type: input.document_type,
      version: input.version,
      file_name: input.file_name,
      file_url: input.file_url,
      file_size: input.file_size,
      mime_type: input.mime_type,
      note: input.note,
      status: '草稿',
      created_by: userId,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * 取得下一個版本號
 */
export async function getNextVersion(requestId: string): Promise<string> {
  const documents = await getRequestDocuments(requestId)

  if (documents.length === 0) {
    return 'v1.0'
  }

  // 找出最大版本號
  const versions = documents.map(d => d.version).filter(v => v.match(/^v\d+\.\d+$/))
  if (versions.length === 0) {
    return 'v1.0'
  }

  const maxVersion = versions
    .map(v => {
      const [major, minor] = v.replace('v', '').split('.').map(Number)
      return { major, minor }
    })
    .sort((a, b) => (a.major === b.major ? b.minor - a.minor : b.major - a.major))[0]

  return `v${maxVersion.major}.${maxVersion.minor + 1}`
}

/**
 * 標記文件為已發送
 */
export async function markDocumentAsSent(
  documentId: string,
  sentVia: string,
  sentTo: string
): Promise<RequestDocument> {
  const { data, error } = await supabase
    .from('request_documents')
    .update({
      status: '已發送',
      sent_at: new Date().toISOString(),
      sent_via: sentVia,
      sent_to: sentTo,
    })
    .eq('id', documentId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * 標記文件為已收到
 */
export async function markDocumentAsReceived(
  documentId: string,
  receivedFrom: string
): Promise<RequestDocument> {
  const { data, error } = await supabase
    .from('request_documents')
    .update({
      status: '已收到',
      received_at: new Date().toISOString(),
      received_from: receivedFrom,
    })
    .eq('id', documentId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * 刪除文件
 */
export async function deleteRequestDocument(documentId: string): Promise<void> {
  const { error } = await supabase.from('request_documents').delete().eq('id', documentId)

  if (error) throw error
}

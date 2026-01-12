/**
 * 提案服務
 * 處理提案和團體套件的業務邏輯
 */

import { supabase } from '@/lib/supabase/client'
import { dynamicFrom } from '@/lib/supabase/typed-client'
import { generateProposalCode } from '@/stores/utils/code-generator'
import { logger } from '@/lib/utils/logger'
import type {
  Proposal,
  ProposalPackage,
  CreateProposalData,
  UpdateProposalData,
  CreatePackageData,
  UpdatePackageData,
  ConvertToTourData,
  ConvertToTourResult,
} from '@/types/proposal.types'

// ============================================
// 提案 CRUD
// ============================================

// Database helpers using dynamicFrom (for tables with JSONB columns requiring custom types)
// The dynamicFrom function encapsulates type coercion in typed-client.ts
const proposalsDb = () => dynamicFrom('proposals')
const packagesDb = () => dynamicFrom('proposal_packages')
const quotesDb = () => dynamicFrom('quotes')
const itinerariesDb = () => dynamicFrom('itineraries')

/**
 * 建立提案
 */
export async function createProposal(
  data: CreateProposalData,
  workspaceId: string,
  userId: string
): Promise<Proposal> {
  // 1. 取得現有提案以生成編號
  const { data: existingProposals } = await proposalsDb()
    .select('code')
    .eq('workspace_id', workspaceId)

  const code = generateProposalCode((existingProposals || []) as { code?: string }[])

  // 2. 建立提案
  const proposalData = {
    code,
    ...data,
    status: 'draft',
    workspace_id: workspaceId,
    created_by: userId,
    updated_by: userId,
  }

  const { data: proposal, error } = await proposalsDb()
    .insert(proposalData)
    .select()
    .single()

  if (error) {
    logger.error('建立提案失敗:', error)
    throw new Error(`建立提案失敗: ${error.message}`)
  }

  return proposal as unknown as Proposal
}

/**
 * 更新提案
 */
export async function updateProposal(
  id: string,
  data: UpdateProposalData,
  userId: string
): Promise<Proposal> {
  const { data: proposal, error } = await proposalsDb()
    .update({
      ...data,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    logger.error('更新提案失敗:', error)
    throw new Error(`更新提案失敗: ${error.message}`)
  }

  return proposal as unknown as Proposal
}

/**
 * 封存提案
 */
export async function archiveProposal(
  id: string,
  reason: string,
  userId: string
): Promise<Proposal> {
  const { data: proposal, error } = await proposalsDb()
    .update({
      status: 'archived',
      archived_at: new Date().toISOString(),
      archive_reason: reason,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    logger.error('封存提案失敗:', error)
    throw new Error(`封存提案失敗: ${error.message}`)
  }

  return proposal as unknown as Proposal
}

/**
 * 取得提案詳情（含套件）
 */
export async function getProposalWithPackages(id: string): Promise<Proposal | null> {
  const { data: proposal, error } = await proposalsDb()
    .select(`
      *,
      packages:proposal_packages(*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    logger.error('取得提案失敗:', error)
    return null
  }

  return proposal as unknown as Proposal
}

// ============================================
// 團體套件 CRUD
// ============================================

/**
 * 建立團體套件
 */
export async function createPackage(
  data: CreatePackageData,
  userId: string,
  workspaceId?: string
): Promise<ProposalPackage> {
  // 1. 取得現有套件以決定版本號
  const { data: existingPackages } = await packagesDb()
    .select('version_number')
    .eq('proposal_id', data.proposal_id)
    .order('version_number', { ascending: false })
    .limit(1)

  const packages = existingPackages as { version_number: number }[] | null
  const versionNumber = packages && packages.length > 0
    ? packages[0].version_number + 1
    : 1

  // 2. 計算天數和晚數
  let days = data.days
  let nights = data.nights
  if (data.start_date && data.end_date && !days) {
    const start = new Date(data.start_date)
    const end = new Date(data.end_date)
    days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    nights = days - 1
  }

  // 3. 建立套件（proposal_packages 沒有 workspace_id 欄位，透過 proposal_id 關聯）
  const packageData = {
    ...data,
    version_number: versionNumber,
    days,
    nights,
    is_selected: false,
    is_active: true,
    created_by: userId,
    updated_by: userId,
  }

  const { data: pkg, error } = await packagesDb()
    .insert(packageData)
    .select()
    .single()

  if (error) {
    logger.error('建立套件失敗:', error)
    throw new Error(`建立套件失敗: ${error.message}`)
  }

  return pkg as unknown as ProposalPackage
}

/**
 * 更新團體套件
 */
export async function updatePackage(
  id: string,
  data: UpdatePackageData,
  userId: string
): Promise<ProposalPackage> {
  const { data: pkg, error } = await packagesDb()
    .update({
      ...data,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    logger.error('更新套件失敗:', error)
    throw new Error(`更新套件失敗: ${error.message}`)
  }

  return pkg as unknown as ProposalPackage
}

/**
 * 複製套件為新版本
 */
export async function duplicatePackage(
  sourceId: string,
  newVersionName: string,
  userId: string,
  workspaceId?: string
): Promise<ProposalPackage> {
  // 1. 取得來源套件
  const { data: source, error: sourceError } = await packagesDb()
    .select('*')
    .eq('id', sourceId)
    .single()

  if (sourceError || !source) {
    throw new Error('找不到來源套件')
  }

  const sourceData = source as unknown as ProposalPackage

  // 2. 如果沒有提供 workspaceId，從 proposal 取得
  let finalWorkspaceId = workspaceId
  if (!finalWorkspaceId && sourceData.proposal_id) {
    const { data: proposal } = await supabase
      .from('proposals')
      .select('workspace_id')
      .eq('id', sourceData.proposal_id)
      .single()
    finalWorkspaceId = proposal?.workspace_id
  }

  // 3. 建立新版本
  const newPackage = await createPackage(
    {
      proposal_id: sourceData.proposal_id,
      version_name: newVersionName,
      country_id: sourceData.country_id || undefined,
      main_city_id: sourceData.main_city_id || undefined,
      destination: sourceData.destination || undefined,
      start_date: sourceData.start_date || undefined,
      end_date: sourceData.end_date || undefined,
      days: sourceData.days || undefined,
      nights: sourceData.nights || undefined,
      group_size: sourceData.group_size || undefined,
      participant_counts: sourceData.participant_counts || undefined,
      notes: sourceData.notes || undefined,
    },
    userId,
    finalWorkspaceId
  )

  return newPackage
}

/**
 * 刪除套件（連同相關的報價單和行程表一起刪除）
 */
export async function deletePackage(id: string): Promise<void> {
  logger.log('開始刪除套件:', id)

  // 刪除關聯的報價單（用 proposal_package_id 關聯）
  const { error: quoteError } = await supabase
    .from('quotes')
    .delete()
    .eq('proposal_package_id', id)

  if (quoteError) {
    logger.warn('刪除關聯報價單時發生錯誤:', quoteError.message)
  } else {
    logger.log('已刪除關聯報價單')
  }

  // 刪除關聯的行程表（用 proposal_package_id 關聯）
  const { error: itinError } = await supabase
    .from('itineraries')
    .delete()
    .eq('proposal_package_id', id)

  if (itinError) {
    logger.warn('刪除關聯行程表時發生錯誤:', itinError.message)
  } else {
    logger.log('已刪除關聯行程表')
  }

  // 刪除套件
  const { error } = await packagesDb()
    .delete()
    .eq('id', id)

  if (error) {
    logger.error('刪除套件失敗:', error.message)
    throw new Error(`刪除套件失敗: ${error.message}`)
  }

  logger.log('套件刪除成功:', id)
}

// ============================================
// 轉開團
// ============================================

/**
 * 將提案轉為正式旅遊團
 * 注意：此功能需要 server-side 執行以繞過 RLS，因此透過 API route 呼叫
 */
export async function convertToTour(
  data: ConvertToTourData,
  workspaceId: string,
  userId: string
): Promise<ConvertToTourResult> {
  const response = await fetch('/api/proposals/convert-to-tour', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // 確保帶上認證 cookies
    body: JSON.stringify({
      ...data,
      workspace_id: workspaceId,
      user_id: userId,
    }),
  })

  // 檢查是否被重定向到登入頁（認證問題）
  if (response.redirected || response.url.includes('/login')) {
    throw new Error('登入逾時，請重新登入')
  }

  // 檢查 content-type 是否為 JSON
  const contentType = response.headers.get('content-type')
  if (!contentType?.includes('application/json')) {
    throw new Error('伺服器回應格式錯誤')
  }

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || '轉開團失敗')
  }

  return result.data
}

// ============================================
// 套件關聯操作
// ============================================

/**
 * 為套件建立報價單
 */
export async function createQuoteForPackage(
  packageId: string,
  workspaceId: string,
  userId: string
): Promise<string> {
  logger.log('createQuoteForPackage called with:', { packageId, workspaceId, userId })

  // 取得套件資訊（明確指定外鍵關聯）
  const { data: pkgData, error: pkgError } = await packagesDb()
    .select('*, proposal:proposals!proposal_packages_proposal_id_fkey(*)')
    .eq('id', packageId)
    .single()

  logger.log('Package query result:', { pkgData, pkgError })

  if (pkgError) {
    throw new Error(`查詢套件失敗: ${pkgError.message}`)
  }

  if (!pkgData) {
    throw new Error(`找不到套件 (ID: ${packageId})`)
  }

  const pkg = pkgData as unknown as ProposalPackage & { proposal?: Proposal }

  // 生成報價單編號
  const { data: existingQuotes } = await supabase
    .from('quotes')
    .select('code')

  // 使用現有的報價單生成邏輯...
  // 這裡簡化處理，實際應該調用 generateCode
  const quoteCode = `Q${Date.now().toString().slice(-6)}`

  // 建立報價單
  const { data: quote, error } = await quotesDb()
    .insert({
      id: crypto.randomUUID(),
      code: quoteCode,
      name: pkg.proposal?.title || pkg.version_name,
      customer_name: pkg.proposal?.customer_name || '待填寫',
      quote_type: 'standard',
      status: 'draft',
      destination: pkg.destination || pkg.proposal?.destination,
      start_date: pkg.start_date || pkg.proposal?.expected_start_date,
      end_date: pkg.end_date || pkg.proposal?.expected_end_date,
      group_size: pkg.group_size || pkg.proposal?.group_size,
      proposal_package_id: packageId,
      itinerary_id: pkg.itinerary_id || null, // 關聯行程表（用於載入航班資訊）
      workspace_id: workspaceId,
      created_by: userId,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`建立報價單失敗: ${error.message}`)
  }

  // 更新套件關聯
  await packagesDb()
    .update({ quote_id: quote.id })
    .eq('id', packageId)

  return quote.id
}

/**
 * 為套件建立行程表
 */
export async function createItineraryForPackage(
  packageId: string,
  workspaceId: string,
  userId: string
): Promise<string> {
  // 取得套件資訊（明確指定外鍵關聯）
  const { data: pkgData, error: pkgError } = await packagesDb()
    .select('*, proposal:proposals!proposal_packages_proposal_id_fkey(*)')
    .eq('id', packageId)
    .single()

  if (pkgError) {
    throw new Error(`查詢套件失敗: ${pkgError.message}`)
  }

  if (!pkgData) {
    throw new Error(`找不到套件 (ID: ${packageId})`)
  }

  const pkg = pkgData as unknown as ProposalPackage & { proposal?: Proposal }

  // 建立行程表
  const { data: itinerary, error } = await itinerariesDb()
    .insert({
      id: crypto.randomUUID(),
      title: pkg.proposal?.title || pkg.version_name,
      tour_code: '',  // 提案階段沒有團號
      status: '提案',
      departure_date: pkg.start_date || pkg.proposal?.expected_start_date || '',
      country: pkg.destination || pkg.proposal?.destination || '',
      city: pkg.destination || pkg.proposal?.destination || '',
      proposal_package_id: packageId,
      workspace_id: workspaceId,
      created_by: userId,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`建立行程表失敗: ${error.message}`)
  }

  // 更新套件關聯
  await packagesDb()
    .update({ itinerary_id: itinerary.id })
    .eq('id', packageId)

  return itinerary.id
}

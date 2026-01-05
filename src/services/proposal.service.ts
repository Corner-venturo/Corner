/**
 * 提案服務
 * 處理提案和團體套件的業務邏輯
 */

import { supabase } from '@/lib/supabase/client'
import { generateProposalCode } from '@/stores/utils/code-generator'
import { generateTourCode } from '@/stores/utils/code-generator'
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

// Helper functions to bypass type checking for tables not yet in generated types
// These tables exist in the database but TypeScript types haven't been regenerated yet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const proposalsDb = () => (supabase as any).from('proposals')
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const packagesDb = () => (supabase as any).from('proposal_packages')
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toursDb = () => (supabase as any).from('tours')
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const quotesDb = () => (supabase as any).from('quotes')
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const itinerariesDb = () => (supabase as any).from('itineraries')

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
  userId: string
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

  // 3. 建立套件
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
  userId: string
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

  // 2. 建立新版本
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
    userId
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
 */
export async function convertToTour(
  data: ConvertToTourData,
  workspaceId: string,
  userId: string
): Promise<ConvertToTourResult> {
  const { proposal_id, package_id, city_code, departure_date } = data

  // 1. 取得提案
  const { data: proposalData, error: proposalError } = await proposalsDb()
    .select('*')
    .eq('id', proposal_id)
    .single()

  if (proposalError || !proposalData) {
    throw new Error('找不到提案')
  }

  const proposal = proposalData as unknown as Proposal

  if (proposal.status === 'converted') {
    throw new Error('此提案已經轉為旅遊團')
  }

  // 2. 取得套件
  const { data: pkgData, error: pkgError } = await packagesDb()
    .select('*')
    .eq('id', package_id)
    .single()

  if (pkgError || !pkgData) {
    throw new Error('找不到團體套件')
  }

  const pkg = pkgData as unknown as ProposalPackage

  // 3. 生成團號
  const { data: existingTours } = await supabase
    .from('tours')
    .select('code')
    .like('code', `${city_code}%`)

  const tourCode = generateTourCode('', city_code, departure_date, existingTours || [])

  // 4. 建立 Tour
  // 計算回程日期：如果套件沒有 end_date，用 departure_date + days 計算
  const daysCount = pkg.days || 1
  const depDate = new Date(pkg.start_date || departure_date)
  const returnDateValue = pkg.end_date || new Date(depDate.getTime() + (daysCount - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const tourData = {
    id: crypto.randomUUID(),
    code: tourCode,
    name: proposal.title,
    location: pkg.destination || proposal.destination,
    country_id: pkg.country_id || proposal.country_id,
    main_city_id: pkg.main_city_id || proposal.main_city_id,
    departure_date: pkg.start_date || departure_date,
    return_date: returnDateValue,
    status: '進行中',
    max_participants: pkg.group_size || proposal.group_size,
    current_participants: 0,
    contract_status: 'pending',
    workspace_id: workspaceId,
    // 財務欄位預設值
    profit: 0,
    total_cost: 0,
    total_revenue: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  logger.log('準備建立旅遊團:', JSON.stringify(tourData, null, 2))

  const { data: newTour, error: tourError } = await toursDb()
    .insert(tourData)
    .select()
    .single()

  if (tourError) {
    logger.error('建立旅遊團失敗:', JSON.stringify(tourError, null, 2))
    logger.error('tourData:', JSON.stringify(tourData, null, 2))
    const errorMsg = tourError.message || tourError.code || tourError.details || tourError.hint || JSON.stringify(tourError)
    throw new Error(`建立旅遊團失敗: ${errorMsg}`)
  }

  // 5. 更新套件的報價單和行程表，關聯到新 Tour
  if (pkg.quote_id) {
    await supabase
      .from('quotes')
      .update({ tour_id: newTour.id })
      .eq('id', pkg.quote_id)
  }

  if (pkg.itinerary_id) {
    await supabase
      .from('itineraries')
      .update({ tour_id: newTour.id, tour_code: tourCode })
      .eq('id', pkg.itinerary_id)
  }

  // 6. 更新提案狀態
  await proposalsDb()
    .update({
      status: 'converted',
      selected_package_id: package_id,
      converted_tour_id: newTour.id,
      converted_at: new Date().toISOString(),
      converted_by: userId,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', proposal_id)

  // 7. 標記套件為選定
  await packagesDb()
    .update({ is_selected: true })
    .eq('id', package_id)

  logger.log('提案轉團成功:', { proposalId: proposal_id, tourCode })

  return {
    tour_id: newTour.id,
    tour_code: tourCode,
    quote_id: pkg.quote_id || undefined,
    itinerary_id: pkg.itinerary_id || undefined,
  }
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

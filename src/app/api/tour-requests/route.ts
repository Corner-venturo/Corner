import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import type { Database, Json } from '@/lib/supabase/types'

type TourRequestInsert = Database['public']['Tables']['tour_requests']['Insert']

/**
 * Tour Requests API
 *
 * GET /api/tour-requests - List tour requests with filters
 * POST /api/tour-requests - Create a new tour request
 */

// Valid status values
const VALID_STATUSES = ['draft', 'pending', 'in_progress', 'replied', 'confirmed', 'completed', 'cancelled']

// Valid category values
const VALID_CATEGORIES = ['flight', 'hotel', 'transport', 'restaurant', 'ticket', 'guide', 'itinerary', 'other']

// Valid handler types
const VALID_HANDLER_TYPES = ['internal', 'external']

// Valid priority values
const VALID_PRIORITIES = ['urgent', 'high', 'normal', 'low']

/**
 * Generate tour request code
 * Format: TR{YYMMDD}{A-Z}-{3digits}
 * Example: TR251226A-001
 */
async function generateTourRequestCode(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  workspaceId: string
): Promise<string> {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(-2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const datePrefix = `TR${yy}${mm}${dd}`

  // Find existing codes with the same date prefix
  const { data: existingRequests } = await supabase
    .from('tour_requests')
    .select('code')
    .eq('workspace_id', workspaceId)
    .like('code', `${datePrefix}%`)
    .order('code', { ascending: false })
    .limit(100)

  if (!existingRequests || existingRequests.length === 0) {
    return `${datePrefix}A-001`
  }

  // Parse existing codes to find the highest number for each letter
  const codePattern = /^TR\d{6}([A-Z])-(\d{3})$/
  const letterNumbers: Record<string, number> = {}

  for (const req of existingRequests) {
    const match = req.code.match(codePattern)
    if (match) {
      const letter = match[1]
      const num = parseInt(match[2], 10)
      if (!letterNumbers[letter] || num > letterNumbers[letter]) {
        letterNumbers[letter] = num
      }
    }
  }

  // Find the current letter with the highest number
  const letters = Object.keys(letterNumbers).sort()
  if (letters.length === 0) {
    return `${datePrefix}A-001`
  }

  const lastLetter = letters[letters.length - 1]
  const lastNumber = letterNumbers[lastLetter]

  // If we haven't reached 999, increment the number
  if (lastNumber < 999) {
    const newNumber = String(lastNumber + 1).padStart(3, '0')
    return `${datePrefix}${lastLetter}-${newNumber}`
  }

  // Otherwise, move to the next letter
  const nextLetter = String.fromCharCode(lastLetter.charCodeAt(0) + 1)
  if (nextLetter > 'Z') {
    // Fallback: use timestamp if we run out of letters (unlikely)
    const timestamp = Date.now().toString().slice(-6)
    return `${datePrefix}X-${timestamp}`
  }

  return `${datePrefix}${nextLetter}-001`
}

/**
 * GET /api/tour-requests
 *
 * Query parameters:
 * - tour_id: Filter by tour ID
 * - status: Filter by status
 * - category: Filter by category
 * - workspace_id: Filter by workspace (required)
 * - limit: Number of results (default 100)
 * - offset: Offset for pagination (default 0)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tourId = searchParams.get('tour_id')
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const workspaceId = searchParams.get('workspace_id')
    const limit = parseInt(searchParams.get('limit') || '100', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const supabaseAdmin = getSupabaseAdminClient()

    // Build query
    let query = supabaseAdmin
      .from('tour_requests')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    // Apply filters
    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId)
    }

    if (tourId) {
      query = query.eq('tour_id', tourId)
    }

    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Valid values: ${VALID_STATUSES.join(', ')}` },
          { status: 400 }
        )
      }
      query = query.eq('status', status)
    }

    if (category) {
      if (!VALID_CATEGORIES.includes(category)) {
        return NextResponse.json(
          { error: `Invalid category. Valid values: ${VALID_CATEGORIES.join(', ')}` },
          { status: 400 }
        )
      }
      query = query.eq('category', category)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      logger.error('Error fetching tour requests:', error)
      return NextResponse.json(
        { error: 'Failed to fetch tour requests' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: data || [],
      count: count || 0,
      limit,
      offset,
    })
  } catch (error) {
    logger.error('Tour requests GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    )
  }
}

interface CreateTourRequestBody {
  tour_id: string
  tour_code?: string
  tour_name?: string
  handler_type: 'internal' | 'external'
  assignee_id?: string
  assignee_name?: string
  supplier_id?: string
  supplier_name?: string
  supplier_type?: string
  category: string
  service_date?: string
  service_date_end?: string
  title: string
  description?: string
  quantity?: number
  specifications?: Record<string, unknown>
  status?: string
  priority?: string
  workspace_id: string
  created_by?: string
  created_by_name?: string
  member_ids?: string[]
  member_data?: Record<string, unknown>
  order_id?: string
  estimated_cost?: number
  currency?: string
}

/**
 * POST /api/tour-requests
 *
 * Create a new tour request with auto-generated code
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateTourRequestBody = await request.json()

    // Validate required fields
    if (!body.tour_id) {
      return NextResponse.json(
        { error: 'tour_id is required' },
        { status: 400 }
      )
    }

    if (!body.title) {
      return NextResponse.json(
        { error: 'title is required' },
        { status: 400 }
      )
    }

    if (!body.category) {
      return NextResponse.json(
        { error: 'category is required' },
        { status: 400 }
      )
    }

    if (!VALID_CATEGORIES.includes(body.category)) {
      return NextResponse.json(
        { error: `Invalid category. Valid values: ${VALID_CATEGORIES.join(', ')}` },
        { status: 400 }
      )
    }

    if (!body.workspace_id) {
      return NextResponse.json(
        { error: 'workspace_id is required' },
        { status: 400 }
      )
    }

    // Validate handler_type
    const handlerType = body.handler_type || 'internal'
    if (!VALID_HANDLER_TYPES.includes(handlerType)) {
      return NextResponse.json(
        { error: `Invalid handler_type. Valid values: ${VALID_HANDLER_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate status if provided
    const status = body.status || 'draft'
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Valid values: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate priority if provided
    const priority = body.priority || 'normal'
    if (!VALID_PRIORITIES.includes(priority)) {
      return NextResponse.json(
        { error: `Invalid priority. Valid values: ${VALID_PRIORITIES.join(', ')}` },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdminClient()

    // Generate code
    const code = await generateTourRequestCode(supabaseAdmin, body.workspace_id)

    // Prepare insert data
    const insertData: TourRequestInsert = {
      code,
      tour_id: body.tour_id,
      tour_code: body.tour_code ?? null,
      tour_name: body.tour_name ?? null,
      handler_type: handlerType,
      assignee_id: body.assignee_id ?? null,
      assignee_name: body.assignee_name ?? null,
      supplier_id: body.supplier_id ?? null,
      supplier_name: body.supplier_name ?? null,
      supplier_type: body.supplier_type ?? null,
      category: body.category,
      service_date: body.service_date ?? null,
      service_date_end: body.service_date_end ?? null,
      title: body.title,
      description: body.description ?? null,
      quantity: body.quantity ?? null,
      specifications: (body.specifications as Json) ?? null,
      status,
      priority,
      workspace_id: body.workspace_id,
      created_by: body.created_by ?? null,
      created_by_name: body.created_by_name ?? null,
      member_ids: body.member_ids ?? null,
      member_data: (body.member_data as Json) ?? null,
      order_id: body.order_id ?? null,
      estimated_cost: body.estimated_cost ?? null,
      currency: body.currency ?? 'TWD',
    }

    const { data, error } = await supabaseAdmin
      .from('tour_requests')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      logger.error('Error creating tour request:', error)
      return NextResponse.json(
        { error: 'Failed to create tour request' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
    }, { status: 201 })
  } catch (error) {
    logger.error('Tour requests POST error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    )
  }
}

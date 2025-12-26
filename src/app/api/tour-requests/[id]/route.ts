import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import type { Database, Json } from '@/lib/supabase/types'

type TourRequestUpdate = Database['public']['Tables']['tour_requests']['Update']

/**
 * Tour Request Detail API
 *
 * GET /api/tour-requests/[id] - Get a single tour request
 * PUT /api/tour-requests/[id] - Update a tour request
 * DELETE /api/tour-requests/[id] - Delete a tour request
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
 * GET /api/tour-requests/[id]
 *
 * Get a single tour request by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Missing tour request ID' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdminClient()

    // Check if id is a UUID or a code
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

    let query = supabaseAdmin.from('tour_requests').select('*')

    if (isUUID) {
      query = query.eq('id', id)
    } else {
      // Try to find by code
      query = query.eq('code', id)
    }

    const { data, error } = await query.single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Tour request not found' },
          { status: 404 }
        )
      }
      logger.error('Error fetching tour request:', error)
      return NextResponse.json(
        { error: 'Failed to fetch tour request' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    logger.error('Tour request GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    )
  }
}

interface UpdateTourRequestBody {
  tour_id?: string
  tour_code?: string
  tour_name?: string
  handler_type?: 'internal' | 'external'
  assignee_id?: string | null
  assignee_name?: string | null
  supplier_id?: string | null
  supplier_name?: string | null
  supplier_type?: string | null
  category?: string
  service_date?: string | null
  service_date_end?: string | null
  title?: string
  description?: string | null
  quantity?: number | null
  specifications?: Record<string, unknown> | null
  status?: string
  priority?: string
  updated_by?: string
  updated_by_name?: string
  member_ids?: string[] | null
  member_data?: Record<string, unknown> | null
  order_id?: string | null
  estimated_cost?: number | null
  quoted_cost?: number | null
  final_cost?: number | null
  currency?: string
  reply_content?: Record<string, unknown> | null
  reply_note?: string | null
  replied_at?: string | null
  replied_by?: string | null
  confirmed_at?: string | null
  confirmed_by?: string | null
  confirmed_by_name?: string | null
  sync_to_app?: boolean
  app_sync_data?: Record<string, unknown> | null
  target_workspace_id?: string | null
}

/**
 * PUT /api/tour-requests/[id]
 *
 * Update a tour request
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body: UpdateTourRequestBody = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'Missing tour request ID' },
        { status: 400 }
      )
    }

    // Validate handler_type if provided
    if (body.handler_type && !VALID_HANDLER_TYPES.includes(body.handler_type)) {
      return NextResponse.json(
        { error: `Invalid handler_type. Valid values: ${VALID_HANDLER_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate category if provided
    if (body.category && !VALID_CATEGORIES.includes(body.category)) {
      return NextResponse.json(
        { error: `Invalid category. Valid values: ${VALID_CATEGORIES.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate status if provided
    if (body.status && !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json(
        { error: `Invalid status. Valid values: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate priority if provided
    if (body.priority && !VALID_PRIORITIES.includes(body.priority)) {
      return NextResponse.json(
        { error: `Invalid priority. Valid values: ${VALID_PRIORITIES.join(', ')}` },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdminClient()

    // Check if id is a UUID or a code
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

    // First, verify the tour request exists
    let existsQuery = supabaseAdmin.from('tour_requests').select('id')
    if (isUUID) {
      existsQuery = existsQuery.eq('id', id)
    } else {
      existsQuery = existsQuery.eq('code', id)
    }

    const { data: existingData, error: existsError } = await existsQuery.single()

    if (existsError || !existingData) {
      return NextResponse.json(
        { error: 'Tour request not found' },
        { status: 404 }
      )
    }

    // Prepare update data - only include fields that are provided
    const updateData: TourRequestUpdate = {
      updated_at: new Date().toISOString(),
    }

    if (body.tour_id !== undefined) updateData.tour_id = body.tour_id
    if (body.tour_code !== undefined) updateData.tour_code = body.tour_code
    if (body.tour_name !== undefined) updateData.tour_name = body.tour_name
    if (body.handler_type !== undefined) updateData.handler_type = body.handler_type
    if (body.assignee_id !== undefined) updateData.assignee_id = body.assignee_id
    if (body.assignee_name !== undefined) updateData.assignee_name = body.assignee_name
    if (body.supplier_id !== undefined) updateData.supplier_id = body.supplier_id
    if (body.supplier_name !== undefined) updateData.supplier_name = body.supplier_name
    if (body.supplier_type !== undefined) updateData.supplier_type = body.supplier_type
    if (body.category !== undefined) updateData.category = body.category
    if (body.service_date !== undefined) updateData.service_date = body.service_date
    if (body.service_date_end !== undefined) updateData.service_date_end = body.service_date_end
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.quantity !== undefined) updateData.quantity = body.quantity
    if (body.specifications !== undefined) updateData.specifications = body.specifications as Json
    if (body.status !== undefined) updateData.status = body.status
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.updated_by !== undefined) updateData.updated_by = body.updated_by
    if (body.updated_by_name !== undefined) updateData.updated_by_name = body.updated_by_name
    if (body.member_ids !== undefined) updateData.member_ids = body.member_ids
    if (body.member_data !== undefined) updateData.member_data = body.member_data as Json
    if (body.order_id !== undefined) updateData.order_id = body.order_id
    if (body.estimated_cost !== undefined) updateData.estimated_cost = body.estimated_cost
    if (body.quoted_cost !== undefined) updateData.quoted_cost = body.quoted_cost
    if (body.final_cost !== undefined) updateData.final_cost = body.final_cost
    if (body.currency !== undefined) updateData.currency = body.currency
    if (body.reply_content !== undefined) updateData.reply_content = body.reply_content as Json
    if (body.reply_note !== undefined) updateData.reply_note = body.reply_note
    if (body.replied_at !== undefined) updateData.replied_at = body.replied_at
    if (body.replied_by !== undefined) updateData.replied_by = body.replied_by
    if (body.confirmed_at !== undefined) updateData.confirmed_at = body.confirmed_at
    if (body.confirmed_by !== undefined) updateData.confirmed_by = body.confirmed_by
    if (body.confirmed_by_name !== undefined) updateData.confirmed_by_name = body.confirmed_by_name
    if (body.sync_to_app !== undefined) updateData.sync_to_app = body.sync_to_app
    if (body.app_sync_data !== undefined) updateData.app_sync_data = body.app_sync_data as Json
    if (body.target_workspace_id !== undefined) updateData.target_workspace_id = body.target_workspace_id

    // Update the tour request
    const { data, error } = await supabaseAdmin
      .from('tour_requests')
      .update(updateData)
      .eq('id', existingData.id)
      .select()
      .single()

    if (error) {
      logger.error('Error updating tour request:', error)
      return NextResponse.json(
        { error: 'Failed to update tour request' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    logger.error('Tour request PUT error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/tour-requests/[id]
 *
 * Delete a tour request
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Missing tour request ID' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdminClient()

    // Check if id is a UUID or a code
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

    // First, verify the tour request exists and get its ID
    let existsQuery = supabaseAdmin.from('tour_requests').select('id')
    if (isUUID) {
      existsQuery = existsQuery.eq('id', id)
    } else {
      existsQuery = existsQuery.eq('code', id)
    }

    const { data: existingData, error: existsError } = await existsQuery.single()

    if (existsError || !existingData) {
      return NextResponse.json(
        { error: 'Tour request not found' },
        { status: 404 }
      )
    }

    // Delete the tour request
    const { error } = await supabaseAdmin
      .from('tour_requests')
      .delete()
      .eq('id', existingData.id)

    if (error) {
      logger.error('Error deleting tour request:', error)
      return NextResponse.json(
        { error: 'Failed to delete tour request' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Tour request deleted successfully',
    })
  } catch (error) {
    logger.error('Tour request DELETE error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    )
  }
}

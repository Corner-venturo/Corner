import { NextRequest } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const bucket = formData.get('bucket') as string
    const path = formData.get('path') as string

    if (!file || !bucket || !path) {
      return errorResponse(
        'Missing required fields: file, bucket, path',
        400,
        ErrorCode.MISSING_FIELD
      )
    }

    const allowedBuckets = ['company-assets', 'passport-images', 'member-documents', 'user-avatars']
    if (!allowedBuckets.includes(bucket)) {
      return errorResponse('Invalid bucket', 400, ErrorCode.VALIDATION_ERROR)
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const supabaseAdmin = getSupabaseAdminClient()
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (error) {
      logger.error('Storage upload error:', error)
      return errorResponse(error.message, 500, ErrorCode.INTERNAL_ERROR)
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(path)

    return successResponse({
      path: data.path,
      publicUrl: publicUrlData.publicUrl,
    })
  } catch (error) {
    logger.error('Upload API error:', error)
    return errorResponse(
      error instanceof Error ? error.message : 'Unknown error',
      500,
      ErrorCode.INTERNAL_ERROR
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bucket = searchParams.get('bucket')
    const path = searchParams.get('path')

    if (!bucket || !path) {
      return errorResponse(
        'Missing required params: bucket, path',
        400,
        ErrorCode.MISSING_FIELD
      )
    }

    const allowedBuckets = ['company-assets', 'passport-images', 'member-documents', 'user-avatars']
    if (!allowedBuckets.includes(bucket)) {
      return errorResponse('Invalid bucket', 400, ErrorCode.VALIDATION_ERROR)
    }

    const supabaseAdmin = getSupabaseAdminClient()
    const { error } = await supabaseAdmin.storage
      .from(bucket)
      .remove([path])

    if (error) {
      logger.error('Storage delete error:', error)
      return errorResponse(error.message, 500, ErrorCode.INTERNAL_ERROR)
    }

    return successResponse(null)
  } catch (error) {
    logger.error('Delete API error:', error)
    return errorResponse(
      error instanceof Error ? error.message : 'Unknown error',
      500,
      ErrorCode.INTERNAL_ERROR
    )
  }
}

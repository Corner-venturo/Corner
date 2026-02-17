/**
 * Simple in-memory rate limiter
 * No external dependencies needed
 */

const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

/**
 * Check if a request is within rate limit
 * @param key - Unique key (e.g., IP + route)
 * @param limit - Max requests per window
 * @param windowMs - Time window in milliseconds
 * @returns true if allowed, false if rate limited
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(key)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (record.count >= limit) return false
  record.count++
  return true
}

/**
 * Get client IP from request headers
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

/**
 * Helper: check rate limit and return 429 response if exceeded
 * Returns null if allowed, Response if rate limited
 */
export function checkRateLimit(
  request: Request,
  route: string,
  limit: number = 10,
  windowMs: number = 60_000
): Response | null {
  const ip = getClientIp(request)
  const key = `${route}:${ip}`

  if (!rateLimit(key, limit, windowMs)) {
    return Response.json(
      { success: false, error: '請求過於頻繁，請稍後再試', code: 'RATE_LIMITED' },
      { status: 429 }
    )
  }

  return null
}

import { redirect } from 'next/navigation'

/**
 * 舊路徑重定向
 * /brochure → /design/new
 */
export default function BrochureRedirect({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  // 保留所有 URL 參數
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === 'string') {
      params.set(key, value)
    } else if (Array.isArray(value)) {
      value.forEach(v => params.append(key, v))
    }
  }

  const queryString = params.toString()
  const newUrl = queryString ? `/design/new?${queryString}` : '/design/new'

  redirect(newUrl)
}

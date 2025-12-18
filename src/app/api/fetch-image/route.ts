import { NextRequest, NextResponse } from 'next/server'

/**
 * 後端 API 代理下載圖片
 * 用於繞過瀏覽器的 CORS 限制
 */
export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: '缺少 URL 參數' }, { status: 400 })
    }

    // 驗證 URL 格式
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return NextResponse.json({ error: '無效的 URL' }, { status: 400 })
    }

    // 下載圖片
    const response = await fetch(url, {
      headers: {
        // 模擬瀏覽器請求
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/*,*/*;q=0.8',
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: '無法下載圖片' }, { status: 502 })
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg'

    // 確認是圖片類型
    if (!contentType.startsWith('image/')) {
      return NextResponse.json({ error: 'URL 不是圖片' }, { status: 400 })
    }

    const imageBuffer = await response.arrayBuffer()

    // 回傳圖片資料
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('Fetch image error:', error)
    return NextResponse.json({ error: '下載圖片失敗' }, { status: 500 })
  }
}

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Upload, Download, Plus, X } from 'lucide-react'

interface TourPage {
  id: string
  type: 'cover' | 'content'
  title: string
  subtitle?: string
  description?: string
  image?: string
  location?: string
}

/**
 * 旅遊手冊編輯器
 * 左側：編輯表單 | 右側：A5 即時預覽
 */
export default function EbookPage() {
  const [pages, setPages] = useState<TourPage[]>([
    {
      id: '1',
      type: 'cover',
      title: '旅遊電子書',
      subtitle: '探索世界上每個角落',
    },
  ])

  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const currentPage = pages[currentPageIndex]

  // 新增頁面
  const addPage = () => {
    const newPage: TourPage = {
      id: Date.now().toString(),
      type: 'content',
      title: '新景點',
      description: '景點描述...',
      location: '地點',
    }
    setPages([...pages, newPage])
    setCurrentPageIndex(pages.length)
  }

  // 刪除頁面
  const deletePage = (index: number) => {
    if (pages.length <= 1) return // 至少保留一頁
    const newPages = pages.filter((_, i) => i !== index)
    setPages(newPages)
    if (currentPageIndex >= newPages.length) {
      setCurrentPageIndex(newPages.length - 1)
    }
  }

  // 更新頁面資料
  const updatePage = (field: keyof TourPage, value: string) => {
    const newPages = [...pages]
    newPages[currentPageIndex] = {
      ...newPages[currentPageIndex],
      [field]: value,
    }
    setPages(newPages)
  }

  // 上傳圖片
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = e => {
        updatePage('image', e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* 載入字體 */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;700&family=Noto+Sans+TC:wght@400;500;700&display=swap');
      `}</style>

      {/* 標題列 */}
      <div className="h-14 border-b flex items-center justify-between px-6">
        <h1 className="text-lg font-semibold">旅遊手冊編輯器</h1>
        <Button variant="default" className="gap-2">
          <Download className="h-4 w-4" />
          匯出 PDF
        </Button>
      </div>

      {/* 主內容區 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左側：編輯表單 */}
        <div className="w-96 border-r flex flex-col bg-muted/20">
          {/* 頁面列表 */}
          <div className="border-b p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium">頁面列表</h2>
              <Button size="sm" variant="outline" onClick={addPage} className="gap-1">
                <Plus className="h-3 w-3" />
                新增頁面
              </Button>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {pages.map((page, index) => (
                <div
                  key={page.id}
                  className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                    index === currentPageIndex
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background hover:bg-accent'
                  }`}
                  onClick={() => setCurrentPageIndex(index)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">P{index + 1}</span>
                    <span className="text-sm truncate max-w-[180px]">{page.title}</span>
                  </div>
                  {pages.length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={e => {
                        e.stopPropagation()
                        deletePage(index)
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 編輯表單 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">頁面類型</label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={currentPage.type}
                onChange={e => updatePage('type', e.target.value)}
              >
                <option value="cover">封面</option>
                <option value="content">內容頁</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">標題</label>
              <Input
                value={currentPage.title}
                onChange={e => updatePage('title', e.target.value)}
                placeholder="輸入標題"
              />
            </div>

            {currentPage.type === 'cover' && (
              <div>
                <label className="text-sm font-medium mb-2 block">副標題</label>
                <Input
                  value={currentPage.subtitle || ''}
                  onChange={e => updatePage('subtitle', e.target.value)}
                  placeholder="輸入副標題"
                />
              </div>
            )}

            {currentPage.type === 'content' && (
              <>
                <div>
                  <label className="text-sm font-medium mb-2 block">地點</label>
                  <Input
                    value={currentPage.location || ''}
                    onChange={e => updatePage('location', e.target.value)}
                    placeholder="輸入地點"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">描述</label>
                  <Textarea
                    value={currentPage.description || ''}
                    onChange={e => updatePage('description', e.target.value)}
                    placeholder="輸入景點描述"
                    rows={4}
                  />
                </div>
              </>
            )}

            <div>
              <label className="text-sm font-medium mb-2 block">圖片</label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                {currentPage.image ? (
                  <div className="relative">
                    <img
                      src={currentPage.image}
                      alt="預覽"
                      className="w-full h-32 object-cover rounded"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2"
                      onClick={() => updatePage('image', '')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">點擊上傳圖片</p>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 右側：A5 預覽 */}
        <div className="flex-1 bg-muted/10 p-8 overflow-auto flex items-center justify-center">
          <div
            className="bg-white shadow-2xl"
            style={{
              width: '420px', // A5 寬度 (148mm = 約 420px @ 72dpi)
              height: '594px', // A5 高度 (210mm = 約 594px @ 72dpi)
              aspectRatio: '148 / 210',
            }}
          >
            {currentPage.type === 'cover' ? (
              // 封面預覽
              <div
                className="w-full h-full relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #F5F2EE 0%, #E8E4E1 100%)',
                }}
              >
                {currentPage.image && (
                  <img
                    src={currentPage.image}
                    alt={currentPage.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-30"
                  />
                )}
                <div className="relative z-10 h-full flex flex-col items-center justify-center p-12">
                  <h1
                    className="text-4xl font-bold mb-4 text-center"
                    style={{
                      fontFamily: '"Noto Serif TC", serif',
                      color: '#2C3E50',
                      letterSpacing: '0.1em',
                    }}
                  >
                    {currentPage.title}
                  </h1>
                  {currentPage.subtitle && (
                    <>
                      <div
                        className="w-32 h-0.5 mb-6"
                        style={{
                          background:
                            'linear-gradient(to right, transparent, #8CBCD0, transparent)',
                        }}
                      />
                      <p
                        className="text-lg text-center"
                        style={{
                          fontFamily: '"Noto Sans TC", sans-serif',
                          color: '#5A6C7D',
                          letterSpacing: '0.05em',
                          lineHeight: '1.8',
                        }}
                      >
                        {currentPage.subtitle}
                      </p>
                    </>
                  )}
                </div>
              </div>
            ) : (
              // 內容頁預覽
              <div className="w-full h-full p-8 flex flex-col">
                {/* 圖片區域 */}
                <div className="flex-1 mb-4 rounded-lg overflow-hidden bg-muted">
                  {currentPage.image ? (
                    <img
                      src={currentPage.image}
                      alt={currentPage.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <Upload className="h-12 w-12 mx-auto mb-2" />
                        <p className="text-sm">尚未上傳圖片</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 文字區域 */}
                <div>
                  <h2
                    className="text-2xl font-bold mb-2"
                    style={{
                      fontFamily: '"Noto Serif TC", serif',
                      color: '#2C3E50',
                    }}
                  >
                    {currentPage.title}
                  </h2>
                  {currentPage.location && (
                    <p
                      className="text-sm mb-3"
                      style={{
                        fontFamily: '"Noto Sans TC", sans-serif',
                        color: '#8CBCD0',
                      }}
                    >
                      📍 {currentPage.location}
                    </p>
                  )}
                  {currentPage.description && (
                    <p
                      className="text-sm leading-relaxed"
                      style={{
                        fontFamily: '"Noto Sans TC", sans-serif',
                        color: '#5A6C7D',
                      }}
                    >
                      {currentPage.description}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

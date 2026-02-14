'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ImageIcon, Search } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { toast } from 'sonner'
import { logger } from '@/lib/utils/logger'
import { COMP_EDITOR_LABELS } from './constants/labels'

interface ImageLibraryItem {
  id: string
  name: string
  public_url: string
  category: string
  tags: string[]
  created_at: string
}

interface ImageLibrarySelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (imageUrl: string) => void
  category?: string
}

export function ImageLibrarySelector({ 
  isOpen, 
  onClose, 
  onSelect, 
  category = 'activity' 
}: ImageLibrarySelectorProps) {
  const [images, setImages] = useState<ImageLibraryItem[]>([])
  const [filteredImages, setFilteredImages] = useState<ImageLibraryItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const workspaceId = useAuthStore(state => state.user?.workspace_id)

  // 載入圖庫圖片
  useEffect(() => {
    if (isOpen && workspaceId) {
      loadLibraryImages()
    }
  }, [isOpen, workspaceId])

  // 搜尋過濾
  useEffect(() => {
    if (!searchTerm) {
      setFilteredImages(images)
    } else {
      const filtered = images.filter(img => 
        img.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        img.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      setFilteredImages(filtered)
    }
  }, [searchTerm, images])

  const loadLibraryImages = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('image_library')
        .select('id, name, public_url, category, tags, created_at')
        .eq('workspace_id', workspaceId ?? '')
        .eq('category', category)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        logger.error(COMP_EDITOR_LABELS.載入圖庫失敗_2, error)
        toast.error(COMP_EDITOR_LABELS.載入圖庫失敗)
        return
      }

      setImages((data || []).map(item => ({
        ...item,
        category: item.category ?? '',
        tags: item.tags ?? []
      })))
    } catch (error) {
      logger.error(COMP_EDITOR_LABELS.載入圖庫錯誤, error)
      toast.error(COMP_EDITOR_LABELS.載入圖庫發生錯誤)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectImage = (imageUrl: string) => {
    onSelect(imageUrl)
    onClose()
    toast.success(COMP_EDITOR_LABELS.已選擇圖片)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent level={1} className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon size={20} className="text-morandi-gold" />
            {COMP_EDITOR_LABELS.SELECT_5812}
          </DialogTitle>
        </DialogHeader>

        {/* 搜尋框 */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-morandi-secondary" />
          <Input
            placeholder={COMP_EDITOR_LABELS.搜尋圖片名稱或標籤}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* 圖片網格 */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-sm text-morandi-secondary">{COMP_EDITOR_LABELS.載入中}</div>
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-morandi-secondary">
              <ImageIcon size={32} className="mb-2 opacity-50" />
              <p className="text-sm">
                {images.length === 0 ? COMP_EDITOR_LABELS.圖庫中還沒有圖片 : COMP_EDITOR_LABELS.沒有符合搜尋條件的圖片}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredImages.map((image) => (
                <motion.div
                  key={image.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="group cursor-pointer"
                  onClick={() => handleSelectImage(image.public_url)}
                >
                  <div className="relative aspect-square rounded-lg overflow-hidden border border-morandi-container group-hover:border-morandi-gold transition-colors">
                    <Image
                      src={image.public_url}
                      alt={image.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    />
                    {/* 懸停遮罩 */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200" />
                    {/* 選擇指示 */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-6 h-6 bg-morandi-gold rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    </div>
                  </div>
                  {/* 圖片名稱 */}
                  <p className="text-xs text-morandi-secondary mt-1 truncate group-hover:text-morandi-primary transition-colors">
                    {image.name}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* 底部按鈕 */}
        <div className="flex justify-end">
          <Button variant="ghost" onClick={onClose}>
            {COMP_EDITOR_LABELS.取消}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
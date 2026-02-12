/**
 * Canvas Editor hook - manages Tiptap editor state and image processing
 */

import { useEffect, useRef, useCallback } from 'react'
import { useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { useEditorState } from '../shared/useCanvasState'
import { CANVAS_LIMITS, IMAGE_QUALITY, UPLOAD_DELAYS, EDITOR_CLASSES } from '../shared/constants'
import { prompt } from '@/lib/ui/alert-dialog'
import { COMP_WORKSPACE_LABELS } from '../../constants/labels'

export function useCanvasEditor(storageKey: string) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { isDragging, setIsDragging, uploadProgress, setUploadProgress, resetUploadProgress } =
    useEditorState()

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: EDITOR_CLASSES.LINK,
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: EDITOR_CLASSES.IMAGE,
        },
      }),
      Placeholder.configure({
        placeholder: COMP_WORKSPACE_LABELS.開始編寫內容,
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: EDITOR_CLASSES.PROSE,
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      localStorage.setItem(storageKey, html)
    },
  })

  // Load saved content
  useEffect(() => {
    if (editor) {
      const savedContent = localStorage.getItem(storageKey)
      if (savedContent) {
        editor.commands.setContent(savedContent)
      } else {
        editor.commands.setContent('')
      }
    }
  }, [editor, storageKey])

  // Prevent default drag behavior
  useEffect(() => {
    const preventDefaults = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
    }

    window.addEventListener('dragover', preventDefaults, false)
    window.addEventListener('drop', preventDefaults, false)

    return () => {
      window.removeEventListener('dragover', preventDefaults, false)
      window.removeEventListener('drop', preventDefaults, false)
    }
  }, [])

  // Image compression
  const compressImage = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = e => {
        const img = new window.Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          const MAX_DIMENSION = CANVAS_LIMITS.MAX_IMAGE_DIMENSION

          if (width > height) {
            if (width > MAX_DIMENSION) {
              height *= MAX_DIMENSION / width
              width = MAX_DIMENSION
            }
          } else {
            if (height > MAX_DIMENSION) {
              width *= MAX_DIMENSION / height
              height = MAX_DIMENSION
            }
          }

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error(COMP_WORKSPACE_LABELS.無法取得_canvas_context))
            return
          }

          ctx.drawImage(img, 0, 0, width, height)

          const quality = file.size > 1024 * 1024 ? IMAGE_QUALITY.LOW : IMAGE_QUALITY.HIGH

          canvas.toBlob(
            blob => {
              if (!blob) {
                reject(new Error(COMP_WORKSPACE_LABELS.圖片壓縮失敗))
                return
              }

              const compressedReader = new FileReader()
              compressedReader.onload = e => {
                resolve(e.target?.result as string)
              }
              compressedReader.onerror = reject
              compressedReader.readAsDataURL(blob)
            },
            'image/jpeg',
            quality
          )
        }

        img.onerror = reject
        img.src = e.target?.result as string
      }

      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }, [])

  // Process image file
  const processImageFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        alert(COMP_WORKSPACE_LABELS.請選擇圖片檔案)
        return
      }

      if (file.size > CANVAS_LIMITS.MAX_IMAGE_SIZE) {
        alert(COMP_WORKSPACE_LABELS.圖片大小不能超過_20MB)
        return
      }

      setUploadProgress(10)

      try {
        let src: string
        if (file.size > CANVAS_LIMITS.COMPRESSION_THRESHOLD) {
          setUploadProgress(30)
          src = await compressImage(file)
          setUploadProgress(80)
        } else {
          src = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = e => resolve(e.target?.result as string)
            reader.onerror = reject
            reader.readAsDataURL(file)
          })
          setUploadProgress(80)
        }

        setUploadProgress(90)
        editor?.chain().focus().setImage({ src }).run()
        setUploadProgress(100)

        setTimeout(() => {
          resetUploadProgress()
        }, UPLOAD_DELAYS.HIDE_PROGRESS)
      } catch (error) {
        alert(COMP_WORKSPACE_LABELS.圖片處理失敗_請重試)
        resetUploadProgress()
      }
    },
    [editor, compressImage, setUploadProgress, resetUploadProgress]
  )

  // Handlers
  const handleImageUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      processImageFile(file)
      event.target.value = ''
    },
    [processImageFile]
  )

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(true)
    },
    [setIsDragging]
  )

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
    },
    [setIsDragging]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const files = Array.from(e.dataTransfer.files)
      const imageFiles = files.filter(file => file.type.startsWith('image/'))

      if (imageFiles.length === 0) {
        alert(COMP_WORKSPACE_LABELS.請拖曳圖片檔案)
        return
      }

      processImageFile(imageFiles[0])

      if (imageFiles.length > 1) {
        imageFiles.slice(1).forEach((file, index) => {
          setTimeout(
            () => {
              processImageFile(file)
            },
            (index + 1) * UPLOAD_DELAYS.BETWEEN_IMAGES
          )
        })
      }
    },
    [processImageFile, setIsDragging]
  )

  const setLink = useCallback(async () => {
    const url = await prompt(COMP_WORKSPACE_LABELS.輸入網址, {
      title: COMP_WORKSPACE_LABELS.插入連結,
      placeholder: 'https://...',
    })
    if (url) {
      editor?.chain().focus().setLink({ href: url }).run()
    }
  }, [editor])

  const addImage = useCallback(async () => {
    const url = await prompt(COMP_WORKSPACE_LABELS.輸入圖片網址, {
      title: COMP_WORKSPACE_LABELS.插入圖片,
      placeholder: 'https://...',
    })
    if (url) {
      editor?.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  return {
    editor,
    fileInputRef,
    isDragging,
    uploadProgress,
    handleImageUpload,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    setLink,
    addImage,
  }
}

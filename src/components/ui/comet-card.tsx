import { cn } from '@/lib/utils'
import { _motion } from 'framer-motion'
import React, { useState, useRef } from 'react'

interface CometCardProps {
  rotateDepth?: number
  _translateDepth?: number
  className?: string
  children: React.ReactNode
}

export function CometCard({
  rotateDepth = 17.5,
  _translateDepth = 20,
  className,
  children,
}: CometCardProps) {
  const [rotation, setRotation] = useState({ x: 0, y: 0 })
  const ref = useRef<HTMLDivElement>(null)

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!ref.current) return

    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const mouseX = event.clientX - centerX
    const mouseY = event.clientY - centerY

    const rotateX = (mouseY / rect.height) * rotateDepth
    const rotateY = -(mouseX / rect.width) * rotateDepth

    setRotation({ x: rotateX, y: rotateY })
  }

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 })
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'relative transform-style-3d transition-transform duration-100 ease-out',
        className
      )}
      style={{
        transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
        transformStyle: 'preserve-3d',
      }}
    >
      {children}
    </div>
  )
}

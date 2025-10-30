'use client'

import { useState, useEffect, useRef } from 'react'

export function useTourItineraryNav(dailyItinerary: any[]) {
  const [activeDayIndex, setActiveDayIndex] = useState(0)
  const dayRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    dayRefs.current = dayRefs.current.slice(0, dailyItinerary.length)
  }, [dailyItinerary.length])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const index = dayRefs.current.findIndex(section => section === entry.target)
            if (index !== -1) {
              setActiveDayIndex(index)
            }
          }
        })
      },
      {
        root: null,
        threshold: 0.35,
        rootMargin: '-30% 0px -45% 0px',
      }
    )

    dayRefs.current.forEach(section => {
      if (section) {
        observer.observe(section)
      }
    })

    return () => observer.disconnect()
  }, [dailyItinerary.length])

  const handleDayNavigate = (index: number) => {
    const target = dayRefs.current[index]
    if (!target) return
    setActiveDayIndex(index)
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return {
    activeDayIndex,
    dayRefs,
    handleDayNavigate,
  }
}

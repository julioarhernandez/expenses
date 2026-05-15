'use client'

import { useEffect } from 'react'
import { useExpenseStore } from '@/store/expenses'

interface HeaderUpdaterProps {
  title: string
  subtitle?: string
}

export function HeaderUpdater({ title, subtitle }: HeaderUpdaterProps) {
  const setHeader = useExpenseStore((state) => state.setHeader)

  useEffect(() => {
    setHeader(title, subtitle)
    
    // Cleanup on unmount if needed, or just let the next page overwrite it
  }, [title, subtitle, setHeader])

  return null
}

'use client'

import { useState } from 'react'
import { Filter } from 'lucide-react'
import { DashboardFiltersOverlay } from './DashboardFiltersOverlay'
import { useTranslation } from '@/hooks/useTranslation'

type PeriodType = 'monthly' | 'quarterly' | 'semi' | 'yearly'

interface DashboardHeaderActionsProps {
  workspaces: any[]
  selectedIds: string[]
  period: PeriodType
  month: number
  quarter: number
  half: number
  year: number
  exportUrl: string
}

export function DashboardHeaderActions(props: DashboardHeaderActionsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { t } = useTranslation()

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white border border-white/10 rounded-full text-sm font-bold shadow-lg shadow-black/5 backdrop-blur-md active:scale-95 transition-all"
      >
        <Filter className="h-4 w-4" />
        {t('expenses').filters}
      </button>

      <DashboardFiltersOverlay 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        {...props} 
      />
    </>
  )
}

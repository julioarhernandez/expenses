'use client'

import { HelpCircle, ChevronRight } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import { useHelpStore, type HelpTopic } from '@/store/help'

interface HelpSupportCardProps {
  topic?: HelpTopic
}

export function HelpSupportCard({ topic = 'dashboard' }: HelpSupportCardProps) {
  const { t } = useTranslation()
  const openHelp = useHelpStore((s) => s.openHelp)

  return (
    <div className="flex flex-col gap-2 pt-6 border-t border-border/50">
      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">
        {t('settings').help_support ?? 'Help & Support'}
      </label>
      <button
        onClick={() => openHelp(topic)}
        className="flex items-center justify-between w-full p-4 bg-muted/30 hover:bg-muted/50 rounded-2xl border border-border transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <HelpCircle className="h-5 w-5 text-white" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-foreground">
              {t('settings').view_help ?? 'View Documentation'}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('settings').help_desc ?? 'Learn how to use Nova'}
            </p>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center border border-border group-hover:border-foreground/20 transition-all">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </button>
    </div>
  )
}

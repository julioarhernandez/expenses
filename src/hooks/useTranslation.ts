'use client'

import { useWorkspaceStore } from '@/store/workspace'
import { translations } from '@/lib/i18n/translations'

export function useTranslation() {
  const uiLanguage = useWorkspaceStore((s) => s.uiLanguage)
  
  // Use any to bypass strict literal type checking between different language dictionaries
  const t = (key: keyof typeof translations.en): any => {
    const dict = (translations as any)[uiLanguage] || translations.en
    return dict[key]
  }

  return { t, lang: uiLanguage }
}

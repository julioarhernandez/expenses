'use client'

import { useWorkspaceStore } from '@/store/workspace'
import { translations } from '@/lib/i18n/translations'

export function useTranslation() {
  const uiLanguage = useWorkspaceStore((s) => s.uiLanguage)
  
  const t = <K extends keyof typeof translations.en>(
    key: K
  ): typeof translations.en[K] => {
    return translations[uiLanguage][key] || translations.en[key]
  }

  return { t, lang: uiLanguage }
}

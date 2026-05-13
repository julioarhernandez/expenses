import { cookies } from 'next/headers'
import { translations } from './translations'

export async function getServerTranslation() {
  const cookieStore = await cookies()
  const lang = (cookieStore.get('ui-language')?.value as 'en' | 'es') || 'en'
  
  const t = <K extends keyof typeof translations.en>(
    key: K
  ): typeof translations.en[K] => {
    return translations[lang][key] || translations.en[key]
  }

  return { t, lang }
}

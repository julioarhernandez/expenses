import { cookies } from 'next/headers'
import { translations } from './translations'

export async function getServerTranslation() {
  const cookieStore = await cookies()
  const lang = (cookieStore.get('ui-language')?.value as 'en' | 'es') || 'en'
  
  const t = <K extends keyof typeof translations.en>(
    key: K
  ): any => {
    return (translations[lang] as any)[key] || (translations.en as any)[key]
  }

  return { t, lang }
}

'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WorkspaceManager } from '@/components/settings/WorkspaceManager'
import { CategoryManager } from '@/components/settings/CategoryManager'
import { useWorkspaceStore } from '@/store/workspace'
import { useTranslation } from '@/hooks/useTranslation'
import { cn } from '@/lib/utils'

export default function SettingsPage() {
  const { voiceLanguage, setVoiceLanguage, uiLanguage, setUiLanguage } = useWorkspaceStore()
  const { t } = useTranslation()

  return (
    <div className="min-h-full bg-[#F8FAFC] px-6 pt-8 pb-32">
      {/* Header Section */}
      <section className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2 text-slate-900">{t('settings').title}</h1>
        <p className="text-slate-500 font-medium">{t('settings').subtitle}</p>
      </section>

      <Tabs defaultValue="workspaces" className="w-full">
        {/* Tab Navigation */}
        <TabsList className="flex p-1.5 bg-slate-200/50 rounded-2xl mb-8 h-auto">
          <TabsTrigger 
            value="workspaces" 
            className="flex-1 py-2.5 text-sm font-semibold rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 text-slate-500 hover:text-slate-700 transition-all"
          >
            {t('settings').workspaces}
          </TabsTrigger>
          <TabsTrigger 
            value="categories" 
            className="flex-1 py-2.5 text-sm font-semibold rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 text-slate-500 hover:text-slate-700 transition-all"
          >
            {t('settings').categories}
          </TabsTrigger>
          <TabsTrigger 
            value="preferences" 
            className="flex-1 py-2.5 text-sm font-semibold rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 text-slate-500 hover:text-slate-700 transition-all"
          >
            {t('settings').preferences}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workspaces" className="mt-0 outline-none">
          <WorkspaceManager />
        </TabsContent>
        <TabsContent value="categories" className="mt-0 outline-none">
          <CategoryManager />
        </TabsContent>
        <TabsContent value="preferences" className="mt-0 outline-none">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-6">{t('settings').app_preferences}</h2>
            <div className="space-y-10">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{t('settings').app_language}</label>
                <div className="flex p-1 bg-slate-100 rounded-xl w-fit">
                  <button
                    onClick={() => setUiLanguage('en')}
                    className={cn(
                      "px-4 py-2 text-sm font-semibold rounded-lg transition-all",
                      uiLanguage === 'en' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    English
                  </button>
                  <button
                    onClick={() => setUiLanguage('es')}
                    className={cn(
                      "px-4 py-2 text-sm font-semibold rounded-lg transition-all",
                      uiLanguage === 'es' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    Español
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">{t('settings').app_language_desc}</p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{t('settings').voice_language}</label>
                <div className="flex p-1 bg-slate-100 rounded-xl w-fit">
                  <button
                    onClick={() => setVoiceLanguage('en-US')}
                    className={cn(
                      "px-4 py-2 text-sm font-semibold rounded-lg transition-all",
                      voiceLanguage === 'en-US' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    English (US)
                  </button>
                  <button
                    onClick={() => setVoiceLanguage('es-ES')}
                    className={cn(
                      "px-4 py-2 text-sm font-semibold rounded-lg transition-all",
                      voiceLanguage === 'es-ES' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    Español (ES)
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">{t('settings').voice_language_desc}</p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

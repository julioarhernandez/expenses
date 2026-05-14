'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WorkspaceManager } from '@/components/settings/WorkspaceManager'
import { CategoryManager } from '@/components/settings/CategoryManager'
import { useWorkspaceStore } from '@/store/workspace'
import { useTranslation } from '@/hooks/useTranslation'
import { cn } from '@/lib/utils'

export default function SettingsPage() {
  const { voiceLanguage, setVoiceLanguage, uiLanguage, setUiLanguage, theme, setTheme } = useWorkspaceStore()
  const { t } = useTranslation()

  return (
    <div className="min-h-full bg-background px-6 pt-8 pb-32">
      {/* Header Section */}
      <section className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2 text-foreground">{t('settings').title}</h1>
        <p className="text-muted-foreground font-medium">{t('settings').subtitle}</p>
      </section>

      <Tabs defaultValue="workspaces" className="w-full">
        {/* Tab Navigation */}
        <TabsList className="flex w-full p-2 bg-muted rounded-3xl mb-8 h-16">
          <TabsTrigger
            value="workspaces"
            className="flex-1 py-4 text-sm font-semibold rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-all"
          >
            {t('settings').workspaces}
          </TabsTrigger>
          <TabsTrigger
            value="categories"
            className="flex-1 py-4 text-sm font-semibold rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-all"
          >
            {t('settings').categories}
          </TabsTrigger>
          <TabsTrigger
            value="preferences"
            className="flex-1 py-4 text-sm font-semibold rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-all"
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
          <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
            <h2 className="text-xl font-bold text-card-foreground mb-6">{t('settings').app_preferences}</h2>
            <div className="space-y-10">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">{t('settings').app_language}</label>
                <div className="flex p-1 bg-muted rounded-xl w-fit">
                  <button
                    onClick={() => setUiLanguage('en')}
                    className={cn(
                      "px-4 py-2 text-sm font-semibold rounded-lg transition-all",
                      uiLanguage === 'en' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    English
                  </button>
                  <button
                    onClick={() => setUiLanguage('es')}
                    className={cn(
                      "px-4 py-2 text-sm font-semibold rounded-lg transition-all",
                      uiLanguage === 'es' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Español
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{t('settings').app_language_desc}</p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">{t('settings').voice_language}</label>
                <div className="flex p-1 bg-muted rounded-xl w-fit">
                  <button
                    onClick={() => setVoiceLanguage('en-US')}
                    className={cn(
                      "px-4 py-2 text-sm font-semibold rounded-lg transition-all",
                      voiceLanguage === 'en-US' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    English (US)
                  </button>
                  <button
                    onClick={() => setVoiceLanguage('es-ES')}
                    className={cn(
                      "px-4 py-2 text-sm font-semibold rounded-lg transition-all",
                      voiceLanguage === 'es-ES' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Español (ES)
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{t('settings').voice_language_desc}</p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">{t('settings').dark_mode}</label>
                <button
                  role="switch"
                  aria-checked={theme === 'dark'}
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className={cn(
                    "relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    theme === 'dark' ? "bg-slate-800" : "bg-slate-200"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                      theme === 'dark' ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                </button>
                <p className="text-xs text-muted-foreground mt-1">{t('settings').dark_mode_desc}</p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

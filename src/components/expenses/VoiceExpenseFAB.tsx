'use client'

import { useState, useEffect, useRef } from 'react'
import { Mic, Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useWorkspaceStore } from '@/store/workspace'
import { useExpenseStore } from '@/store/expenses'
import { format } from 'date-fns'
import type { Category } from '@/types'
import { useTranslation } from '@/hooks/useTranslation'
import { useHelpStore } from '@/store/help'

const MAX_DURATION = 20
const COUNTDOWN_AT = 3
const RADIUS = 30
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function VoiceExpenseFAB() {
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId)
  const voiceLanguage = useWorkspaceStore((s) => s.voiceLanguage)
  const { openDialog, isActionMenuOpen, setActionMenuOpen } = useExpenseStore()
  const { t, lang } = useTranslation()
  const { openHelp } = useHelpStore()
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showHint, setShowHint] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const categoriesRef = useRef<Category[]>([])
  const [mounted, setMounted] = useState(false)
  const [recordingProgress, setRecordingProgress] = useState(0)
  const [countdown, setCountdown] = useState<number | null>(null)

  const recognitionRef = useRef<any>(null)
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const autoStopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setMounted(true)
    const timer = setTimeout(() => setShowHint(false), 12000)
    return () => clearTimeout(timer)
  }, [])

  const supabase = createClient()
  const SpeechRecognition = typeof window !== 'undefined' ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) : null

  useEffect(() => {
    supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('name')
      .then(({ data }) => {
        if (data) { setCategories(data); categoriesRef.current = data }
      })
  }, [])

  function clearRecordingTimers() {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
    if (autoStopTimeoutRef.current) clearTimeout(autoStopTimeoutRef.current)
    progressIntervalRef.current = null
    autoStopTimeoutRef.current = null
    setRecordingProgress(0)
    setCountdown(null)
  }

  useEffect(() => {
    if (!mounted || !SpeechRecognition) return
    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = voiceLanguage

    recognition.onstart = () => {
      setIsRecording(true)
      setRecordingProgress(0)
      setCountdown(null)

      const startTime = Date.now()
      progressIntervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000
        const progress = Math.min(elapsed / MAX_DURATION, 1)
        setRecordingProgress(progress)
        const remaining = MAX_DURATION - elapsed
        setCountdown(remaining <= COUNTDOWN_AT ? Math.ceil(remaining) : null)
      }, 100)

      autoStopTimeoutRef.current = setTimeout(() => {
        recognitionRef.current?.stop()
      }, MAX_DURATION * 1000)
    }

    recognition.onresult = async (event: any) => {
      setIsRecording(false)
      clearRecordingTimers()
      const transcript = event.results[0][0].transcript
      if (transcript) {
        toast.info(lang === 'es' ? `Escuchado: "${transcript}"` : `Heard: "${transcript}"`)
        await processSpeech(transcript)
      }
    }

    recognition.onerror = (event: any) => {
      setIsRecording(false)
      clearRecordingTimers()
      if (event.error !== 'no-speech') {
        console.error('Speech recognition error', event.error)
        toast.error(lang === 'es' ? 'Error al reconocer voz. Intenta de nuevo.' : 'Failed to recognize speech. Please try again.')
      }
    }

    recognition.onend = () => {
      setIsRecording(false)
      clearRecordingTimers()
    }

    recognitionRef.current = recognition
  }, [SpeechRecognition, mounted, activeWorkspaceId, voiceLanguage, lang])

  async function processSpeech(transcript: string) {
    if (!activeWorkspaceId) return
    setIsProcessing(true)

    const toastId = toast.loading(lang === 'es' ? `Procesando: "${transcript}"...` : `Processing: "${transcript}"...`)

    try {
      const res = await fetch('/api/ai-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `Today is ${format(new Date(), 'yyyy-MM-dd')}. User speech: ${transcript}`,
          categories: categoriesRef.current.map(c => c.name)
        })
      })

      if (!res.ok) throw new Error('AI extraction failed')
      const extracted = await res.json()

      let categoryId = null
      if (extracted.suggested_category) {
        const cat = categoriesRef.current.find(c => c.name.toLowerCase() === extracted.suggested_category?.toLowerCase())
        if (cat) categoryId = cat.id
      }

      const expenseDate = extracted.date || format(new Date(), 'yyyy-MM-dd')
      const expenseAmount = extracted.amount || 0
      const expenseMerchant = extracted.merchant || 'Unknown'

      openDialog({
        draft: {
          workspace_id: activeWorkspaceId,
          merchant: expenseMerchant,
          amount: expenseAmount,
          tax_amount: extracted.tax_amount ?? null,
          date: expenseDate,
          currency: extracted.currency || 'USD',
          payment_method: extracted.payment_method || 'other',
          card_last_four: extracted.card_last_four ?? null,
          notes: lang === 'es' ? `Nota de voz: "${transcript}"` : `Voice note: "${transcript}"`,
          category_id: categoryId,
          receipt_path: null
        } as any
      })

      toast.success(lang === 'es' ? `¡Listo! Revisa los detalles para ${expenseMerchant}` : `Ready! Check the details for ${expenseMerchant}`, { id: toastId })
    } catch (err: any) {
      console.error(err)
      toast.error(lang === 'es' ? 'Error al procesar gasto por voz' : 'Failed to process voice expense', { id: toastId })
    } finally {
      setIsProcessing(false)
    }
  }

  const MIC_HELP_KEY = 'nova-mic-help-seen'

  const toggleRecording = () => {
    if (!SpeechRecognition) {
      toast.error(lang === 'es' ? 'El reconocimiento de voz no es soportado en este navegador.' : 'Speech recognition is not supported in this browser.')
      return
    }

    if (isRecording) {
      recognitionRef.current?.stop()
      return
    }

    const alreadySeen = typeof window !== 'undefined' && localStorage.getItem(MIC_HELP_KEY) === '1'
    if (!alreadySeen) {
      localStorage.setItem(MIC_HELP_KEY, '1')
      openHelp('voice')
      return
    }

    recognitionRef.current?.start()
  }

  if (!mounted || !SpeechRecognition) return null

  const examples = {
    en: 'Brunch at Panera yesterday 40 dollars or gas at 7eleven 30 dollars',
    es: 'Brunch en Panera ayer 40 dólares o gasolina en 7eleven 30 dólares'
  }

  return (
    <div className="fixed z-[110] bottom-28 right-6 md:bottom-8 md:right-8 flex flex-col items-end gap-3 pointer-events-none">
      {/* Action Menu & Recording State */}
      {(isActionMenuOpen || isRecording) && (
        <div className="flex flex-col items-end gap-3 mb-2 pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Voice / Recording Action */}
          <div className="flex items-center gap-3">
             <span className={cn(
                "bg-background/90 backdrop-blur-md border border-border px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider text-muted-foreground shadow-sm transition-opacity",
                isRecording && "opacity-50"
             )}>
                {lang === 'es' ? 'Voz' : 'Voice'}
             </span>
             
             <div className="relative w-12 h-12 flex items-center justify-center">
                {isRecording && (
                    <>
                        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none z-10 scale-[1.3]" viewBox="0 0 80 80">
                            <circle cx="40" cy="40" r={RADIUS} fill="none" stroke="currentColor" strokeWidth="4" className="text-white/20" />
                            <circle cx="40" cy="40" r={RADIUS} fill="none" stroke="currentColor" strokeWidth="4" className="text-white transition-all duration-100" strokeDasharray={CIRCUMFERENCE} strokeDashoffset={CIRCUMFERENCE * recordingProgress} strokeLinecap="round" />
                        </svg>
                        {countdown !== null && (
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
                                {countdown}
                            </div>
                        )}
                    </>
                )}
                <button
                    onClick={toggleRecording}
                    disabled={isProcessing}
                    className={cn(
                        "relative w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-300 transform active:scale-90",
                        isRecording ? "bg-red-500 animate-pulse scale-110" : "bg-[#6366F1] shadow-indigo-200",
                        isProcessing && "opacity-50 cursor-not-allowed"
                    )}
                >
                    <Mic className={cn("transition-all duration-300", isRecording ? "w-6 h-6" : "w-5 h-5")} />
                </button>
             </div>
          </div>
          
          {/* Manual Action */}
          <div className="flex items-center gap-3">
              <span className={cn(
                "bg-background/90 backdrop-blur-md border border-border px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider text-muted-foreground shadow-sm transition-opacity",
                isRecording && "opacity-50"
              )}>
                  {lang === 'es' ? 'Manual' : 'Manual'}
              </span>
              <button
                  onClick={() => openDialog()}
                  disabled={isRecording || isProcessing}
                  className={cn(
                    "w-12 h-12 bg-[#6366F1] rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-200 transition-all duration-300 transform active:scale-90",
                    (isRecording || isProcessing) && "opacity-50 cursor-not-allowed grayscale-[0.5]"
                  )}
              >
                  <Plus className="w-5 h-5" />
              </button>
          </div>
        </div>
      )}

      {/* Main Desktop Toggle (Hidden on mobile because navbar handle it) */}
      <div className="hidden md:flex relative pointer-events-auto">
        <button
          onClick={() => setActionMenuOpen(!isActionMenuOpen)}
          disabled={isProcessing}
          className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-300 transform active:scale-90",
            isActionMenuOpen ? "bg-muted text-muted-foreground rotate-45" : "bg-[#6366F1] shadow-indigo-200 hover:scale-105"
          )}
        >
          {isProcessing ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <Plus className="w-7 h-7" />
          )}
        </button>
      </div>

      {/* Processing overlay for mobile/desktop */}
      {isProcessing && (
         <div className="fixed inset-0 bg-background/20 backdrop-blur-[2px] z-[120] flex items-center justify-center pointer-events-auto">
             <div className="bg-background border border-border p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4">
                 <Loader2 className="w-8 h-8 text-[#6366F1] animate-spin" />
                 <p className="text-sm font-medium">{lang === 'es' ? 'Procesando gasto...' : 'Processing expense...'}</p>
             </div>
         </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { Mic, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useWorkspaceStore } from '@/store/workspace'
import { useExpenseStore } from '@/store/expenses'
import { format } from 'date-fns'
import type { Category } from '@/types'
import { useTranslation } from '@/hooks/useTranslation'

export function VoiceExpenseFAB() {
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId)
  const voiceLanguage = useWorkspaceStore((s) => s.voiceLanguage)
  const { openDialog } = useExpenseStore()
  const { t, lang } = useTranslation()
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showHint, setShowHint] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const timer = setTimeout(() => setShowHint(false), 12000)
    return () => clearTimeout(timer)
  }, [])

  const supabase = createClient()

  const SpeechRecognition = typeof window !== 'undefined' ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) : null
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if (!activeWorkspaceId) return
    supabase
      .from('categories')
      .select('*')
      .eq('workspace_id', activeWorkspaceId)
      .then(({ data }) => {
        if (data) setCategories(data)
      })
  }, [activeWorkspaceId])

  useEffect(() => {
    if (!mounted || !SpeechRecognition) return
    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = voiceLanguage

    recognition.onstart = () => setIsRecording(true)

    recognition.onresult = async (event: any) => {
      setIsRecording(false)
      const transcript = event.results[0][0].transcript
      if (transcript) {
        toast.info(lang === 'es' ? `Escuchado: "${transcript}"` : `Heard: "${transcript}"`)
        await processSpeech(transcript)
      }
    }

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error)
      setIsRecording(false)
      if (event.error !== 'no-speech') {
        toast.error(lang === 'es' ? 'Error al reconocer voz. Intenta de nuevo.' : 'Failed to recognize speech. Please try again.')
      }
    }

    recognition.onend = () => {
      setIsRecording(false)
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
          categories: categories.map(c => c.name)
        })
      })

      if (!res.ok) throw new Error('AI extraction failed')

      const extracted = await res.json()

      // Map category
      let categoryId = null
      if (extracted.suggested_category) {
        const cat = categories.find(c => c.name.toLowerCase() === extracted.suggested_category?.toLowerCase())
        if (cat) categoryId = cat.id
      }

      // Set defaults for required fields if AI misses them
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

  const toggleRecording = () => {
    if (!SpeechRecognition) {
      toast.error(lang === 'es' ? 'El reconocimiento de voz no es soportado en este navegador.' : 'Speech recognition is not supported in this browser.')
      return
    }

    if (isRecording) {
      recognitionRef.current?.stop()
    } else {
      recognitionRef.current?.start()
    }
  }

  if (!mounted || !SpeechRecognition) return null

  const examples = {
    en: 'Brunch at Panera yesterday 40 dollars or gas at 7eleven 30 dollars',
    es: 'Brunch en Panera ayer 40 dólares o gasolina en 7eleven 30 dólares'
  }

  return (
    <div className="fixed z-50 bottom-28 right-6 md:bottom-8 md:right-8 flex items-center gap-3">
      {mounted && showHint && !isRecording && !isProcessing && (
        <div className="bg-background/80 backdrop-blur-md border border-border px-3 py-2 rounded-xl shadow-lg text-[11px] font-medium text-muted-foreground animate-in fade-in slide-in-from-bottom-2 duration-700 max-w-[180px] text-right leading-tight">
          {examples[lang] || examples['en']}
        </div>
      )}
      <button
        onClick={toggleRecording}
        disabled={isProcessing}
        className={`flex items-center justify-center transition-all duration-300 transform active:scale-95
          w-14 h-14 rounded-2xl text-white ring-4 ring-background shadow-lg
          ${isRecording ? 'bg-red-500 shadow-red-200 animate-pulse scale-110' : 'bg-[#6366F1] shadow-indigo-200 hover:scale-105'}
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        title={lang === 'es' ? 'Añadir gasto por voz' : 'Add expense by voice'}
      >
        {isProcessing ? (
          <Loader2 className="w-6 h-6 text-white animate-spin" />
        ) : (
          <Mic className="w-6 h-6 text-white" />
        )}
      </button>
    </div>
  )
}

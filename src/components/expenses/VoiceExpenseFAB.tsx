'use client'

import { useState, useEffect, useRef } from 'react'
import { Mic, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useWorkspaceStore } from '@/store/workspace'
import { useExpenseStore } from '@/store/expenses'
import { createExpense } from '@/lib/expenses'
import { format } from 'date-fns'
import type { Category } from '@/types'

export function VoiceExpenseFAB() {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => setMounted(true), [])
  
  const { activeWorkspaceId } = useWorkspaceStore()
  const addExpense = useExpenseStore(s => s.addExpense)
  const supabase = createClient()
  
  // @ts-ignore
  const SpeechRecognition = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null
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
    recognition.lang = 'en-US'

    recognition.onstart = () => setIsRecording(true)
    
    recognition.onresult = async (event: any) => {
      setIsRecording(false)
      const transcript = event.results[0][0].transcript
      if (transcript) {
        await processSpeech(transcript)
      }
    }

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error)
      setIsRecording(false)
      if (event.error !== 'no-speech') {
        toast.error('Failed to recognize speech. Please try again.')
      }
    }

    recognition.onend = () => {
      setIsRecording(false)
    }

    recognitionRef.current = recognition
  }, [SpeechRecognition, activeWorkspaceId, categories])

  async function processSpeech(transcript: string) {
    if (!activeWorkspaceId) return
    setIsProcessing(true)
    
    const toastId = toast.loading(`Processing: "${transcript}"...`)
    
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
      
      const newExpense = await createExpense({
        workspace_id: activeWorkspaceId,
        merchant: expenseMerchant,
        amount: expenseAmount,
        tax_amount: extracted.tax_amount ?? null,
        date: expenseDate,
        currency: extracted.currency || 'USD',
        payment_method: extracted.payment_method || 'other',
        card_last_four: extracted.card_last_four ?? null,
        notes: `Voice note: "${transcript}"`,
        category_id: categoryId,
        receipt_path: null
      })
      
      addExpense(newExpense)
      toast.success(`Added ${expenseMerchant} - $${expenseAmount}`, { id: toastId })
    } catch (err: any) {
      console.error(err)
      toast.error('Failed to process voice expense', { id: toastId })
    } finally {
      setIsProcessing(false)
    }
  }

  const toggleRecording = () => {
    if (!SpeechRecognition) {
      toast.error('Speech recognition is not supported in this browser.')
      return
    }
    
    if (isRecording) {
      recognitionRef.current?.stop()
    } else {
      recognitionRef.current?.start()
    }
  }

  if (!mounted || !SpeechRecognition) return null

  return (
    <button
      onClick={toggleRecording}
      disabled={isProcessing}
      className={`fixed z-50 flex items-center justify-center transition-all duration-300 shadow-xl
        bottom-28 right-6 md:bottom-8 md:right-8 w-14 h-14 rounded-full
        ${isRecording ? 'bg-red-500 animate-pulse scale-110' : 'bg-slate-900 hover:bg-slate-800 hover:scale-105 active:scale-95'}
        ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      title="Add expense by voice"
    >
      {isProcessing ? (
        <Loader2 className="w-6 h-6 text-white animate-spin" />
      ) : (
        <Mic className="w-6 h-6 text-white" />
      )}
    </button>
  )
}

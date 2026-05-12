'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Loader2, FileText, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import type { OcrExtraction } from '@/types'

interface ReceiptUploaderProps {
  onReceiptUploaded: (data: { url: string; path: string }) => void
  onExtractionComplete: (data: OcrExtraction) => void
  existingUrl?: string
}

type Step = 'idle' | 'uploading' | 'ocr' | 'extracting' | 'done'

export function ReceiptUploader({
  onReceiptUploaded,
  onExtractionComplete,
  existingUrl,
}: ReceiptUploaderProps) {
  const [step, setStep] = useState<Step>('idle')
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingUrl || null)
  const [fileName, setFileName] = useState<string | null>(null)

  const STEP_LABELS: Record<Step, string> = {
    idle: '',
    uploading: 'Uploading…',
    ocr: 'Reading receipt…',
    extracting: 'Extracting data…',
    done: 'Done',
  }

  const processFile = useCallback(
    async (file: File) => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setFileName(file.name)
      if (file.type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(file))
      }

      // 1. Upload to Supabase Storage
      setStep('uploading')
      const ext = file.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('receipts').upload(path, file)
      if (uploadError) {
        toast.error(`Upload failed: ${uploadError.message}`)
        setStep('idle')
        return
      }

      const { data: { publicUrl } } = supabase.storage.from('receipts').getPublicUrl(path)
      onReceiptUploaded({ url: publicUrl, path })

      // 2. OCR (images only — skip PDF for now)
      if (file.type.startsWith('image/')) {
        setStep('ocr')
        const fd = new FormData()
        fd.append('file', file)
        const ocrRes = await fetch('/api/ocr', { method: 'POST', body: fd })
        if (!ocrRes.ok) {
          toast.error('OCR failed — you can still fill fields manually')
          setStep('done')
          return
        }
        const { text } = await ocrRes.json() as { text: string }

        // 3. AI extraction
        setStep('extracting')
        const aiRes = await fetch('/api/ai-extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        })
        if (aiRes.ok) {
          const extracted = await aiRes.json() as OcrExtraction
          onExtractionComplete(extracted)
          toast.success('Fields pre-filled from receipt')
        }
      }

      setStep('done')
    },
    [onReceiptUploaded, onExtractionComplete]
  )

  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted[0]) processFile(accepted[0])
    },
    [processFile]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'application/pdf': [] },
    maxFiles: 1,
    disabled: step !== 'idle' && step !== 'done',
  })

  const isProcessing = step !== 'idle' && step !== 'done'

  return (
    <div className="space-y-2">
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-4 cursor-pointer transition-colors text-center',
          isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50',
          isProcessing && 'pointer-events-none opacity-60'
        )}
      >
        <input {...getInputProps()} />

        {previewUrl && previewUrl.match(/\.(jpg|jpeg|png|webp)$/i) ? (
          <div className="relative w-24 h-24 mx-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Receipt" className="w-full h-full object-cover rounded" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 py-2">
            {isProcessing ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{STEP_LABELS[step]}</p>
              </>
            ) : step === 'done' ? (
              <>
                <Sparkles className="h-6 w-6 text-green-500" />
                <p className="text-xs text-muted-foreground">{fileName}</p>
              </>
            ) : (
              <>
                <Upload className="h-6 w-6 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  {isDragActive ? 'Drop receipt here' : 'Upload receipt (JPG, PNG, PDF)'}
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {previewUrl && step === 'done' && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <FileText className="h-3.5 w-3.5" />
          <span className="truncate">{fileName ?? 'Receipt uploaded'}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-5 w-5 ml-auto"
            onClick={() => {
              setPreviewUrl(null)
              setFileName(null)
              setStep('idle')
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  )
}

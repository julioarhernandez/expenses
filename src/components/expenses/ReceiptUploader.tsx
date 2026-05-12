'use client'

import { useCallback, useRef, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Loader2, FileText, Sparkles, Camera } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { OcrExtraction } from '@/types'

interface ReceiptUploaderProps {
  onFileSelected: (file: File, localUrl?: string) => void
  onFileRemoved?: () => void
  onExtractionComplete: (data: OcrExtraction) => void
  existingUrl?: string
  categories?: { id: string; name: string }[]
}

type Step = 'idle' | 'ocr' | 'extracting' | 'done'

export function ReceiptUploader({
  onFileSelected,
  onFileRemoved,
  onExtractionComplete,
  existingUrl,
  categories,
}: ReceiptUploaderProps) {
  const [step, setStep] = useState<Step>('idle')
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingUrl || null)
  const [fileName, setFileName] = useState<string | null>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const STEP_LABELS: Record<Step, string> = {
    idle: '',
    ocr: 'Reading receipt…',
    extracting: 'Extracting data…',
    done: 'Done',
  }

  const processFile = useCallback(
    async (file: File) => {
      setFileName(file.name)
      const localUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
      if (localUrl) setPreviewUrl(localUrl)

      onFileSelected(file, localUrl)

      if (!file.type.startsWith('image/')) {
        setStep('done')
        return
      }

      // OCR
      setStep('ocr')
      const fd = new FormData()
      fd.append('file', file)
      const ocrRes = await fetch('/api/ocr', { method: 'POST', body: fd })
      if (!ocrRes.ok) {
        const { error: ocrErr } = await ocrRes.json().catch(() => ({ error: undefined })) as { error?: string }
        toast.error(ocrErr ?? 'OCR failed', { description: 'You can still fill fields manually' })
        setStep('done')
        return
      }
      const { text } = await ocrRes.json() as { text: string }

      // AI extraction
      setStep('extracting')
      const aiRes = await fetch('/api/ai-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, categories: categories?.map((c) => c.name) }),
      })
      if (!aiRes.ok) {
        const { error: aiErr } = await aiRes.json().catch(() => ({ error: undefined })) as { error?: string }
        toast.error(aiErr ?? 'AI extraction failed', { description: 'You can still fill fields manually' })
      } else {
        const extracted = await aiRes.json() as OcrExtraction
        onExtractionComplete(extracted)
        toast.success('Fields pre-filled from receipt')
      }

      setStep('done')
    },
    [onFileSelected, onExtractionComplete, categories]
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
      {/* Hidden camera input */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) processFile(file)
          e.target.value = ''
        }}
      />

      <div className="flex gap-2">
        <div
          {...getRootProps()}
          className={cn(
            'flex-1 border-2 border-dashed rounded-lg p-4 cursor-pointer transition-colors text-center',
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
                    {isDragActive ? 'Drop receipt here' : 'Upload receipt'}
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          className="shrink-0 h-auto flex-col gap-1 px-3 py-2 text-xs"
          disabled={isProcessing}
          onClick={() => cameraInputRef.current?.click()}
        >
          <Camera className="h-5 w-5" />
          Photo
        </Button>
      </div>

      {previewUrl && step === 'done' && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <FileText className="h-3.5 w-3.5" />
          <span className="truncate">{fileName ?? 'Receipt attached'}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-5 w-5 ml-auto"
            onClick={() => {
              setPreviewUrl(null)
              setFileName(null)
              setStep('idle')
              onFileRemoved?.()
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  )
}

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'OCR not configured' }, { status: 500 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString('base64')

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64 },
            features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
          },
        ],
      }),
    }
  )

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const raw: string = body?.error?.message ?? 'Vision API request failed'
    // Keep only the first sentence to avoid overwhelming the user
    const message = raw.split('.')[0]
    return NextResponse.json({ error: message }, { status: 502 })
  }

  const data = await response.json()
  const text: string = data.responses?.[0]?.fullTextAnnotation?.text ?? ''

  return NextResponse.json({ text })
}

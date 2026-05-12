import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const extractionSchema = {
  type: 'object' as const,
  properties: {
    merchant: { type: 'string' },
    amount: { type: 'number' },
    tax_amount: { type: ['number', 'null'] },
    date: { type: 'string', description: 'ISO 8601 date (YYYY-MM-DD)' },
    currency: { type: 'string', description: '3-letter ISO 4217 code, e.g. USD' },
    payment_method: {
      type: ['string', 'null'],
      enum: ['credit_card', 'debit_card', 'cash', 'bank_transfer', 'other', null],
    },
    card_last_four: {
      type: ['string', 'null'],
      description: 'Last 4 digits of the card used, if visible on the receipt (digits only, no spaces or dashes)',
    },
    suggested_category: {
      type: ['string', 'null'],
      description: 'Best matching category name from the provided list, or null if none fit',
    },
  },
  required: ['merchant', 'amount', 'tax_amount', 'date', 'currency', 'payment_method', 'card_last_four', 'suggested_category'],
  additionalProperties: false,
}

export async function POST(request: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'AI extraction not configured' }, { status: 500 })
  }

  const { text, categories } = await request.json() as { text: string; categories?: string[] }
  if (!text?.trim()) {
    return NextResponse.json({ error: 'No text provided' }, { status: 400 })
  }

  const categoryInstruction = categories?.length
    ? `Available categories: ${categories.join(', ')}. Set suggested_category to the best matching category name from that list, or null if none fit.`
    : 'Set suggested_category to null.'

  let completion: Awaited<ReturnType<typeof client.chat.completions.create>>
  try {
    completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            `You are a receipt parser. Extract structured expense data from the receipt text. Use ISO 8601 for dates. Return null for fields you cannot determine. ${categoryInstruction}`,
        },
        { role: 'user', content: text },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'expense_extraction',
          schema: extractionSchema,
          strict: true,
        },
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'OpenAI request failed'
    return NextResponse.json({ error: message }, { status: 502 })
  }

  const raw = completion.choices[0]?.message?.content
  if (!raw) {
    return NextResponse.json({ error: 'No extraction result' }, { status: 502 })
  }

  try {
    const extracted = JSON.parse(raw)
    return NextResponse.json(extracted)
  } catch {
    return NextResponse.json({ error: 'Failed to parse extraction result' }, { status: 502 })
  }
}

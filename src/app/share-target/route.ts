import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const base = new URL(request.url).origin

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(`${base}/login`)
    }

    const formData = await request.formData()
    const file = formData.get('receipt') as File | null

    if (!file || file.size === 0) {
      return NextResponse.redirect(`${base}/expenses?new=true`)
    }

    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${user.id}/share-${Date.now()}.${ext}`
    const bytes = await file.arrayBuffer()

    const { error } = await supabase.storage
      .from('receipts')
      .upload(path, bytes, { contentType: file.type, upsert: false })

    if (error) {
      return NextResponse.redirect(`${base}/expenses?new=true`)
    }

    const { data: { publicUrl } } = supabase.storage
      .from('receipts')
      .getPublicUrl(path)

    const dest = new URL('/expenses', base)
    dest.searchParams.set('new', 'true')
    dest.searchParams.set('share_url', publicUrl)
    dest.searchParams.set('share_path', path)

    return NextResponse.redirect(dest.toString())
  } catch {
    return NextResponse.redirect(`${base}/expenses?new=true`)
  }
}

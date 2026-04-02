import { brevo } from '@/lib/brevo'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const account = await brevo.getAccount()
    return NextResponse.json({ ok: true, plan: account.plan?.[0]?.type || 'unknown', email: account.email })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

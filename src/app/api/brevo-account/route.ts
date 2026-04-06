import { brevo } from '@/lib/brevo'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const account = await brevo.getAccount()
    const plan = account.plan || []
    const emailPlan = plan.find((p: { type: string }) => p.type === 'payAsYouGo' || p.type === 'free' || p.type === 'subscription') || plan[0]
    
    return NextResponse.json({
      email: account.email,
      plan: emailPlan?.type || 'unknown',
      credits: emailPlan?.credits || account.plan?.[0]?.credits || 0,
      remainingCredits: account.plan?.[0]?.credits || 0,
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

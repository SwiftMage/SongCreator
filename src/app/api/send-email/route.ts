import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createServerComponentClient } from '@/lib/supabase/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerComponentClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { subject, message } = await req.json()

    if (!subject || !message) {
      return NextResponse.json(
        { error: 'Subject and message are required' },
        { status: 400 }
      )
    }

    const userEmail = user?.email || 'Not provided'
    const userId = user?.id || 'Anonymous'

    const emailContent = `
      <h2>New Support Request</h2>
      <p><strong>From:</strong> ${userEmail}</p>
      <p><strong>User ID:</strong> ${userId}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <h3>Message:</h3>
      <p>${message.replace(/\n/g, '<br>')}</p>
    `

    const { data, error } = await resend.emails.send({
      from: 'Song Mint Support <onboarding@resend.dev>',
      to: 'appspire@icloud.com',
      subject: `Support Request: ${subject}`,
      html: emailContent,
      replyTo: userEmail !== 'Not provided' ? userEmail : undefined
    })

    if (error) {
      console.error('Failed to send email:', error)
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in send-email API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
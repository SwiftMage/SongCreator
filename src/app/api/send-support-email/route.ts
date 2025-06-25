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

    let userData = {
      email: 'Anonymous user',
      userId: 'Not logged in',
      fullName: 'Not provided',
      creditsRemaining: 'Unknown',
      subscriptionStatus: 'Unknown',
      accountCreated: 'Unknown',
      totalSongs: 0,
      recentSongs: [] as Array<{ title: string; status: string; created: string }>
    }

    if (user) {
      userData.email = user.email || 'No email'
      userData.userId = user.id

      // Get user profile information
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        userData.fullName = profile.full_name || 'Not provided'
        userData.creditsRemaining = profile.credits_remaining?.toString() || '0'
        userData.subscriptionStatus = profile.subscription_status || 'None'
        userData.accountCreated = new Date(profile.created_at).toLocaleDateString()
      }

      // Get user's songs information
      const { data: songs, count } = await supabase
        .from('songs')
        .select('id, title, status, created_at', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (songs) {
        userData.totalSongs = count || 0
        userData.recentSongs = songs.map(song => ({
          title: song.title,
          status: song.status,
          created: new Date(song.created_at).toLocaleDateString()
        }))
      }
    }

    const emailContent = `
      <h2>Support Request from Song Mint User</h2>
      
      <h3>User Information:</h3>
      <table style="border-collapse: collapse; width: 100%; margin-bottom: 20px;">
        <tr style="background-color: #f8f9fa;">
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Email:</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${userData.email}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">User ID:</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${userData.userId}</td>
        </tr>
        <tr style="background-color: #f8f9fa;">
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Full Name:</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${userData.fullName}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Credits Remaining:</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${userData.creditsRemaining}</td>
        </tr>
        <tr style="background-color: #f8f9fa;">
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Subscription Status:</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${userData.subscriptionStatus}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Account Created:</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${userData.accountCreated}</td>
        </tr>
        <tr style="background-color: #f8f9fa;">
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Total Songs:</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${userData.totalSongs}</td>
        </tr>
      </table>

      ${userData.recentSongs.length > 0 ? `
        <h3>Recent Songs:</h3>
        <ul>
          ${userData.recentSongs.map(song => 
            `<li><strong>${song.title}</strong> - Status: ${song.status} (Created: ${song.created})</li>`
          ).join('')}
        </ul>
      ` : ''}

      <h3>Support Request:</h3>
      <p><strong>Subject:</strong> ${subject}</p>
      <h4>Message:</h4>
      <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 10px 0;">
        ${message.replace(/\n/g, '<br>')}
      </div>
    `

    const { data, error } = await resend.emails.send({
      from: 'Song Mint Support <onboarding@resend.dev>',
      to: 'appspire@icloud.com',
      subject: `Support Request: ${subject}`,
      html: emailContent,
      replyTo: userData.email !== 'Anonymous user' && userData.email !== 'No email' ? userData.email : undefined
    })

    if (error) {
      console.error('Failed to send support email:', error)
      return NextResponse.json(
        { error: 'Failed to send support email' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in send-support-email API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    // Check if API key is set
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not set')
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      )
    }

    const supabase = await createServerComponentClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { error: 'You must be logged in to report an issue' },
        { status: 401 }
      )
    }

    const { songId, songUrl, issueDescription } = await request.json()

    if (!songId || !issueDescription) {
      return NextResponse.json(
        { error: 'Song ID and issue description are required' },
        { status: 400 }
      )
    }

    // Get song details
    const { data: song, error: songError } = await supabase
      .from('songs')
      .select('*')
      .eq('id', songId)
      .single()

    if (songError || !song) {
      return NextResponse.json(
        { error: 'Song not found' },
        { status: 404 }
      )
    }

    // Get user profile for additional info
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Prepare email content
    const emailHtml = `
      <h2>Song Generation Issue Report</h2>
      ${process.env.NODE_ENV !== 'production' ? '<p style="color: orange;"><strong>TEST MODE:</strong> This email was sent in development mode.</p>' : ''}
      
      <h3>User Information:</h3>
      <ul>
        <li><strong>User ID:</strong> ${user.id}</li>
        <li><strong>Email:</strong> ${user.email}</li>
        <li><strong>Full Name:</strong> ${profile?.full_name || 'Not provided'}</li>
        <li><strong>Credits Remaining:</strong> ${profile?.credits_remaining || 0}</li>
      </ul>
      
      <h3>Song Information:</h3>
      <ul>
        <li><strong>Song ID:</strong> ${songId}</li>
        <li><strong>Song Page URL:</strong> <a href="${songUrl}">${songUrl}</a></li>
        <li><strong>Dashboard Link:</strong> User can find this song in their <a href="${songUrl.split('/create/generating')[0]}/dashboard">dashboard</a></li>
        <li><strong>Created At:</strong> ${new Date(song.created_at).toLocaleString()}</li>
        <li><strong>Song Title:</strong> ${song.title || 'Untitled'}</li>
        <li><strong>Genre:</strong> ${song.questionnaire_data?.genres?.join(', ') || 'Not specified'}</li>
      </ul>
      
      <h3>Audio Files:</h3>
      <ul>
        ${song.audio_urls && song.audio_urls.length > 0 
          ? song.audio_urls.map((url: string, index: number) => 
              `<li><strong>Version ${index + 1}:</strong> <a href="${url}">${url}</a></li>`
            ).join('')
          : '<li>No audio URLs available</li>'
        }
      </ul>
      
      <h3>Issue Description:</h3>
      <p>${issueDescription.replace(/\n/g, '<br>')}</p>
      
      <h3>Song Data:</h3>
      <details>
        <summary>Click to expand questionnaire data</summary>
        <pre>${JSON.stringify(song.questionnaire_data, null, 2)}</pre>
      </details>
      
      <h3>Technical Details:</h3>
      <ul>
        <li><strong>Mureka Task ID:</strong> ${song.mureka_task_id || 'Not available'}</li>
        <li><strong>Lyrics:</strong> <pre style="background: #f5f5f5; padding: 10px; overflow-x: auto;">${song.lyrics || 'Not available'}</pre></li>
      </ul>
      
      ${song.mureka_data ? `
      <h3>Mureka API Response:</h3>
      <details>
        <summary>Click to expand Mureka data</summary>
        <pre style="background: #f5f5f5; padding: 10px; overflow-x: auto;">${JSON.stringify(song.mureka_data, null, 2)}</pre>
      </details>
      ` : ''}
    `

    // Send email using Resend
    console.log('Attempting to send email...')
    console.log('Environment:', process.env.NODE_ENV)
    
    // In development/test mode, Resend can only send to the account owner's email
    const toEmail = process.env.NODE_ENV === 'production' 
      ? 'appspire@icloud.com' 
      : 'evangjones@gmail.com'
    
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'noreply@resend.dev',
      to: toEmail,
      subject: `Song Issue Report - User: ${user.email} - Song: ${songId}`,
      html: emailHtml,
      replyTo: user.email
    })

    if (emailError) {
      console.error('Error sending email:', emailError)
      console.error('Email error details:', JSON.stringify(emailError, null, 2))
      return NextResponse.json(
        { error: `Failed to send report: ${emailError.message || 'Unknown error'}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Issue report sent successfully'
    })

  } catch (error) {
    console.error('Error processing issue report:', error)
    return NextResponse.json(
      { error: 'Failed to process issue report' },
      { status: 500 }
    )
  }
}
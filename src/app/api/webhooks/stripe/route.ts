import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase'
import { Resend } from 'resend'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia'
})

const resend = new Resend(process.env.RESEND_API_KEY)

// Map subscription plan IDs to credit amounts
const PLAN_CREDITS: Record<string, number> = {
  'prod_Sc17KxGFrbExyC': 5,  // Lite - 5 credits
  'prod_Sc17XcZXJ7uh7u': 15, // Plus - 15 credits  
  'prod_Sc18pmjLNU5OWN': 30, // Max - 30 credits
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    console.error('No Stripe signature found')
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createClient()

  try {
    switch (event.type) {
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        
        // Only process subscription invoices (not one-time payments)
        if (invoice.subscription && invoice.billing_reason === 'subscription_cycle') {
          await handleSubscriptionPayment(invoice, supabase)
        }
        break
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionCreated(subscription, supabase)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(subscription, supabase)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionCancelled(subscription, supabase)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', {
      eventType: event.type,
      eventId: event.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json({ 
      error: 'Webhook processing failed',
      eventId: event.id 
    }, { status: 500 })
  }
}

async function handleSubscriptionPayment(invoice: Stripe.Invoice, supabase: any) {
  try {
    // Get subscription details
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
    const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer
    
    if (!customer.email) {
      console.error('No customer email found for subscription payment')
      return
    }

    // Get the product ID from the subscription
    const productId = subscription.items.data[0]?.price.product as string
    const creditsToAdd = PLAN_CREDITS[productId]

    if (!creditsToAdd) {
      console.error(`Unknown product ID: ${productId}`)
      return
    }

    // Find user by stripe_customer_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, credits_remaining')
      .eq('stripe_customer_id', customer.id)
      .single()

    if (profileError || !profile) {
      console.error('User not found for subscription payment. Customer ID:', customer.id, 'Error:', profileError)
      return
    }

    // Add credits to user account using secure function
    const { error: creditError } = await supabase.rpc('update_user_credits', {
      target_user_id: profile.id,
      credit_change: creditsToAdd,
      operation_type: 'subscription_billing'
    })

    if (creditError) {
      console.error('Failed to add credits for subscription payment:', creditError)
      throw new Error(`Credit operation failed: ${creditError.message}`)
    }

    // Update subscription status
    const { error: statusError } = await supabase
      .from('profiles')
      .update({ subscription_status: getSubscriptionTier(productId) })
      .eq('id', profile.id)

    if (statusError) {
      console.error('Failed to update subscription status:', statusError)
      throw new Error(`Status update failed: ${statusError.message}`)
    }

    // Record billing history
    const { error: billingError } = await supabase
      .from('billing_history')
      .insert({
        user_id: profile.id,
        amount: invoice.amount_paid / 100, // Convert cents to dollars
        credits_added: creditsToAdd,
        stripe_invoice_id: invoice.id,
        stripe_subscription_id: subscription.id,
        billing_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        billing_period_end: new Date(subscription.current_period_end * 1000).toISOString()
      })

    if (billingError) {
      console.error('Failed to record billing history:', billingError)
      // Don't throw - billing success should still proceed even if history fails
    }

    // Send email notification (with retry logic)
    try {
      await sendBillingSuccessEmail(customer.email, creditsToAdd, invoice.amount_paid / 100)
    } catch (emailError) {
      console.error('Failed to send billing success email (will retry):', emailError)
      // Don't throw - billing success shouldn't fail due to email issues
      // Could implement retry queue here
    }

    console.log(`Successfully processed subscription payment for ${customer.email}: +${creditsToAdd} credits (Invoice: ${invoice.id})`)
  } catch (error) {
    console.error('Error processing subscription payment:', error)
    throw error
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription, supabase: any) {
  try {
    const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer
    
    if (!customer.email) {
      console.error('No customer email found for new subscription')
      return
    }

    const productId = subscription.items.data[0]?.price.product as string
    
    // Update user's subscription info
    const { error } = await supabase
      .from('profiles')
      .update({
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer,
        subscription_plan_id: productId,
        subscription_status: getSubscriptionTier(productId),
        billing_cycle_anchor: new Date(subscription.billing_cycle_anchor * 1000).toISOString(),
        next_billing_date: new Date(subscription.current_period_end * 1000).toISOString()
      })
      .eq('stripe_customer_id', subscription.customer)

    if (error) {
      console.error('Failed to update subscription info:', error)
      throw new Error(`Subscription creation update failed: ${error.message}`)
    }

    console.log(`Subscription created for ${customer.email}: ${subscription.id}`)
  } catch (error) {
    console.error('Error handling subscription creation:', error)
    throw error
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription, supabase: any) {
  try {
    const productId = subscription.items.data[0]?.price.product as string
    
    // Validate subscription status
    let subscriptionStatus: string
    switch (subscription.status) {
      case 'active':
        subscriptionStatus = getSubscriptionTier(productId)
        break
      case 'past_due':
      case 'unpaid':
        console.warn(`Subscription ${subscription.id} has payment issues: ${subscription.status}`)
        subscriptionStatus = 'cancelled'
        break
      case 'canceled':
      case 'incomplete_expired':
        subscriptionStatus = 'cancelled'
        break
      default:
        console.warn(`Unknown subscription status: ${subscription.status}`)
        subscriptionStatus = 'cancelled'
    }
    
    // Update subscription details
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_plan_id: productId,
        subscription_status: subscriptionStatus,
        next_billing_date: subscription.status === 'active' ? new Date(subscription.current_period_end * 1000).toISOString() : null
      })
      .eq('stripe_subscription_id', subscription.id)

    if (error) {
      console.error('Failed to update subscription:', error)
      throw new Error(`Subscription update failed: ${error.message}`)
    }

    console.log(`Subscription updated: ${subscription.id} - Status: ${subscription.status} -> ${subscriptionStatus}`)
  } catch (error) {
    console.error('Error handling subscription update:', error)
    throw error
  }
}

async function handleSubscriptionCancelled(subscription: Stripe.Subscription, supabase: any) {
  try {
    // Update user's subscription status (preserve customer_id for easier re-subscription)
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'cancelled',
        stripe_subscription_id: null,
        subscription_plan_id: null,
        next_billing_date: null
        // Keep stripe_customer_id for easier re-subscription
      })
      .eq('stripe_subscription_id', subscription.id)

    if (error) {
      console.error('Failed to cancel subscription:', error)
      throw new Error(`Subscription cancellation failed: ${error.message}`)
    }

    console.log(`Subscription cancelled: ${subscription.id} (customer ID preserved for re-subscription)`)
  } catch (error) {
    console.error('Error handling subscription cancellation:', error)
    throw error
  }
}

function getSubscriptionTier(productId: string): string {
  switch (productId) {
    case 'prod_Sc17KxGFrbExyC': return 'lite'
    case 'prod_Sc17XcZXJ7uh7u': return 'plus' 
    case 'prod_Sc18pmjLNU5OWN': return 'max'
    default: return 'free'
  }
}

async function sendBillingSuccessEmail(email: string, creditsAdded: number, amountPaid: number) {
  try {
    await resend.emails.send({
      from: 'billing@songmint.app',
      to: email,
      subject: `🎵 Your ${creditsAdded} credits have been added!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #7c3aed;">Payment Successful!</h2>
          <p>Great news! Your monthly subscription payment has been processed successfully.</p>
          
          <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #1f2937;">What you received:</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li><strong>${creditsAdded} new credits</strong> added to your account</li>
              <li>Each credit creates 1 song with 2 unique versions</li>
              <li>Credits roll over if unused</li>
            </ul>
          </div>

          <div style="background: #ecfdf5; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 0; color: #065f46;"><strong>Amount charged: $${amountPaid.toFixed(2)}</strong></p>
          </div>

          <p>Ready to create your next song? <a href="https://songmint.app/create" style="color: #7c3aed;">Start creating now!</a></p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 14px; color: #6b7280;">
            Need help? Reply to this email or visit our <a href="https://songmint.app/support">support center</a>.
          </p>
        </div>
      `
    })
  } catch (error) {
    console.error('Failed to send billing success email:', error)
    // Don't throw - billing success shouldn't fail due to email issues
  }
}
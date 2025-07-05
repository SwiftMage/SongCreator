import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase'
import { Resend } from 'resend'
import { rateLimiters, getClientIdentifier, applyRateLimit } from '@/lib/rate-limiter'
import { getStripeKeys, getStripeProductIds } from '@/lib/stripe-config'

// Initialize Stripe lazily
let stripe: Stripe | null = null;
const getStripe = () => {
  if (!stripe) {
    const stripeKeys = getStripeKeys();
    stripe = new Stripe(stripeKeys.secretKey, {
      apiVersion: '2025-05-28.basil',
    });
  }
  return stripe;
};

const resend = new Resend(process.env.RESEND_API_KEY)

// Get plan credits dynamically
const getPlanCredits = () => {
  const productIds = getStripeProductIds();
  return {
    [productIds.lite]: 5,   // Lite - 5 credits
    [productIds.plus]: 15,  // Plus - 15 credits  
    [productIds.max]: 30,   // Max - 30 credits
  };
};

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  // Apply rate limiting for webhook endpoints
  const clientId = getClientIdentifier(request)
  const rateLimitResponse = await applyRateLimit(request, rateLimiters.webhook, clientId)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    console.error('No Stripe signature found')
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    const stripeInstance = getStripe();
    event = stripeInstance.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createClient()
  let attemptNumber = 1

  // Get attempt number from headers (for Stripe retry attempts)
  const retryAttempt = request.headers.get('stripe-webhook-attempt')
  if (retryAttempt) {
    attemptNumber = parseInt(retryAttempt) || 1
  }

  try {
    // Check if this event was already processed (idempotency protection)
    const { data: alreadyProcessed } = await supabase
      .rpc('check_stripe_event_processed', { event_id: event.id })

    if (alreadyProcessed) {
      console.log(`Event ${event.id} already processed, skipping`)
      
      // Log webhook attempt
      await supabase.rpc('log_webhook_attempt', {
        p_stripe_event_id: event.id,
        p_event_type: event.type,
        p_attempt_number: attemptNumber,
        p_success: true,
        p_error_details: 'Already processed',
        p_processing_time_ms: Date.now() - startTime
      })
      
      return NextResponse.json({ received: true, status: 'already_processed' })
    }

    // Mark event as being processed
    await supabase.rpc('mark_stripe_event_processed', {
      event_id: event.id,
      event_type: event.type,
      user_id: null, // Will be updated in specific handlers if user is found
      event_metadata: { 
        object_id: (event.data.object as any).id || 'unknown',
        created: event.created,
        attempt_number: attemptNumber
      }
    })

    switch (event.type) {
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        
        console.log('Invoice payment succeeded debug:', {
          invoiceId: invoice.id,
          hasSubscription: !!(invoice as any).subscription,
          subscriptionId: (invoice as any).subscription,
          billingReason: (invoice as any).billing_reason,
          customerId: invoice.customer
        });
        
        // Process all subscription invoices - both initial and recurring
        if ((invoice as any).subscription) {
          const billingReason = (invoice as any).billing_reason;
          console.log(`Processing invoice payment: ${invoice.id}, billing_reason: ${billingReason}`);
          
          if (billingReason === 'subscription_create' || billingReason === 'subscription_cycle') {
            await handleSubscriptionPayment(invoice, supabase)
          } else {
            console.log(`Skipping invoice - unhandled billing reason: ${billingReason}`);
          }
        } else {
          console.log('Skipping invoice - no subscription ID found');
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

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutSessionCompleted(session, supabase)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    // Log successful webhook processing
    await supabase.rpc('log_webhook_attempt', {
      p_stripe_event_id: event.id,
      p_event_type: event.type,
      p_attempt_number: attemptNumber,
      p_success: true,
      p_error_details: null,
      p_processing_time_ms: Date.now() - startTime
    })
    
    return NextResponse.json({ received: true })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    console.error('Webhook processing error:', {
      eventType: event.type,
      eventId: event.id,
      attemptNumber,
      error: errorMessage,
      stack: errorStack
    })
    
    // Log failed webhook attempt
    try {
      await supabase.rpc('log_webhook_attempt', {
        p_stripe_event_id: event.id,
        p_event_type: event.type,
        p_attempt_number: attemptNumber,
        p_success: false,
        p_error_details: errorMessage,
        p_processing_time_ms: Date.now() - startTime
      })
    } catch (logError) {
      console.error('Failed to log webhook attempt:', logError)
    }
    
    // Return appropriate status code for Stripe retry behavior
    // 5xx = Stripe will retry, 4xx = Stripe won't retry
    const shouldRetry = attemptNumber < 3 && !errorMessage.includes('User not found')
    const statusCode = shouldRetry ? 500 : 400
    
    return NextResponse.json({ 
      error: 'Webhook processing failed',
      eventId: event.id,
      retry: shouldRetry,
      attempt: attemptNumber
    }, { status: statusCode })
  }
}

async function handleSubscriptionCredits(subscription: Stripe.Subscription, supabase: any) {
  try {
    const stripeInstance = getStripe();
    const planCredits = getPlanCredits();
    
    // Get customer details
    const customer = await stripeInstance.customers.retrieve(subscription.customer as string) as Stripe.Customer
    
    if (!customer.email) {
      console.error('No customer email found for subscription credits')
      return
    }

    // Get the product ID from the subscription
    const productId = subscription.items.data[0]?.price.product as string
    const creditsToAdd = planCredits[productId]

    if (!creditsToAdd) {
      console.error(`Unknown product ID for credits: ${productId}`)
      return
    }

    // Find user by stripe_customer_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, credits_remaining')
      .eq('stripe_customer_id', customer.id)
      .single()

    if (profileError || !profile) {
      console.error('User not found for subscription credits. Customer ID:', customer.id, 'Error:', profileError)
      return
    }

    // Add credits to user account using secure function
    const { error: creditError } = await supabase.rpc('update_user_credits', {
      target_user_id: profile.id,
      credit_change: creditsToAdd,
      operation_type: 'subscription_create'
    })

    if (creditError) {
      console.error('Failed to add credits for new subscription:', creditError)
      throw new Error(`Credit operation failed: ${creditError.message}`)
    }

    // Record billing history for initial subscription
    const { error: billingError } = await supabase
      .from('billing_history')
      .insert({
        user_id: profile.id,
        amount: (subscription.items.data[0]?.price.unit_amount || 0) / 100, // Convert cents to dollars
        credits_added: creditsToAdd,
        stripe_subscription_id: subscription.id,
        billing_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
        billing_period_end: new Date((subscription as any).current_period_end * 1000).toISOString()
      })

    if (billingError) {
      console.error('Failed to record initial billing history:', billingError)
      // Don't throw - credit success should still proceed even if history fails
    }

    // Send email notification
    try {
      await sendSubscriptionWelcomeEmail(customer.email, creditsToAdd, (subscription.items.data[0]?.price.unit_amount || 0) / 100)
    } catch (emailError) {
      console.error('Failed to send subscription welcome email:', emailError)
      // Don't throw - credit success shouldn't fail due to email issues
    }

    console.log(`Successfully added initial subscription credits for ${customer.email}: +${creditsToAdd} credits (Subscription: ${subscription.id})`)
  } catch (error) {
    console.error('Error processing subscription credits:', error)
    throw error
  }
}

async function handleSubscriptionPayment(invoice: Stripe.Invoice, supabase: any) {
  try {
    const stripeInstance = getStripe();
    const planCredits = getPlanCredits();
    
    // Get subscription details - for initial payments, we need to get the subscription ID
    const subscriptionId = (invoice as any).subscription as string;
    if (!subscriptionId) {
      console.error('No subscription ID found in invoice:', invoice.id);
      return;
    }
    
    const subscription = await stripeInstance.subscriptions.retrieve(subscriptionId)
    const customer = await stripeInstance.customers.retrieve(subscription.customer as string) as Stripe.Customer
    
    if (!customer.email) {
      console.error('No customer email found for subscription payment')
      return
    }

    // Get the product ID from the subscription
    const productId = subscription.items.data[0]?.price.product as string
    const creditsToAdd = planCredits[productId]

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

    // Add credits to user account using secure function with payment reference
    const { data: creditResult, error: creditError } = await supabase.rpc('update_user_credits', {
      target_user_id: profile.id,
      credit_change: creditsToAdd,
      operation_type: 'subscription_billing',
      payment_reference: invoice.id
    })

    if (creditError || !creditResult?.[0]?.success) {
      console.error('Failed to add credits for subscription payment:', creditError)
      throw new Error(`Credit operation failed: ${creditError?.message || 'Unknown error'}`)
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

    // Record billing history using safe function
    const { data: billingResult, error: billingError } = await supabase.rpc('record_billing_transaction', {
      p_user_id: profile.id,
      p_amount: invoice.amount_paid / 100, // Convert cents to dollars
      p_credits_added: creditsToAdd,
      p_stripe_invoice_id: invoice.id,
      p_stripe_subscription_id: subscription.id,
      p_billing_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
      p_billing_period_end: new Date((subscription as any).current_period_end * 1000).toISOString()
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
    const stripeInstance = getStripe();
    const customer = await stripeInstance.customers.retrieve(subscription.customer as string) as Stripe.Customer
    
    if (!customer.email) {
      console.error('No customer email found for new subscription')
      return
    }

    const productId = subscription.items.data[0]?.price.product as string
    
    // Safely handle dates - check if timestamps are valid
    const safeBillingCycleAnchor = subscription.billing_cycle_anchor && subscription.billing_cycle_anchor > 0 
      ? new Date(subscription.billing_cycle_anchor * 1000).toISOString()
      : null;
    
    const safeNextBillingDate = (subscription as any).current_period_end && (subscription as any).current_period_end > 0
      ? new Date((subscription as any).current_period_end * 1000).toISOString()
      : null;

    // Update user's subscription info
    const { error } = await supabase
      .from('profiles')
      .update({
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer,
        subscription_plan_id: productId,
        subscription_status: getSubscriptionTier(productId),
        billing_cycle_anchor: safeBillingCycleAnchor,
        next_billing_date: safeNextBillingDate
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
        next_billing_date: subscription.status === 'active' ? new Date((subscription as any).current_period_end * 1000).toISOString() : null
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

async function sendSubscriptionWelcomeEmail(email: string, creditsAdded: number, amountPaid: number) {
  try {
    await resend.emails.send({
      from: 'billing@songmint.app',
      to: email,
      subject: `🎵 Welcome to Song Mint! Your ${creditsAdded} credits are ready!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #7c3aed;">Welcome to Song Mint AI! 🎉</h2>
          <p>Thank you for subscribing! Your monthly subscription is now active and your credits are ready to use.</p>
          
          <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #1f2937;">Your subscription includes:</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li><strong>${creditsAdded} fresh credits</strong> every month</li>
              <li>Each credit creates 1 song with 2 unique versions</li>
              <li>Unused credits roll over to next month</li>
              <li>Cancel anytime - no long-term commitment</li>
            </ul>
          </div>

          <div style="background: #ecfdf5; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 0; color: #065f46;"><strong>Monthly charge: $${amountPaid.toFixed(2)}</strong></p>
          </div>

          <p>Ready to create your first song? <a href="https://songmint.app/create" style="color: #7c3aed;">Start creating now!</a></p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 14px; color: #6b7280;">
            Need help? Reply to this email or visit our <a href="https://songmint.app/support">support center</a>.<br>
            Manage your subscription anytime in your <a href="https://songmint.app/dashboard/account">account dashboard</a>.
          </p>
        </div>
      `
    })
  } catch (error) {
    console.error('Failed to send subscription welcome email:', error)
    // Don't throw - subscription success shouldn't fail due to email issues
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session, supabase: any) {
  try {
    console.log('Processing checkout session completed:', session.id, 'mode:', session.mode)
    
    // Skip subscription checkouts (handled by invoice.payment_succeeded)
    if (session.mode === 'subscription') {
      console.log('Skipping subscription checkout - handled by invoice events')
      return
    }

    // Handle one-time purchase
    if (session.mode === 'payment' && session.payment_status === 'paid') {
      await handleOneTimePurchase(session, supabase)
    } else {
      console.log(`Unhandled checkout session: mode=${session.mode}, payment_status=${session.payment_status}`)
    }
  } catch (error) {
    console.error('Error handling checkout session completed:', error)
    throw error
  }
}

async function handleOneTimePurchase(session: Stripe.Checkout.Session, supabase: any) {
  try {
    const stripeInstance = getStripe();
    const userId = session.metadata?.userId
    const creditsToAdd = parseInt(session.metadata?.credits || '0')

    if (!userId || !creditsToAdd) {
      console.error('Missing metadata in checkout session:', { userId, creditsToAdd, sessionId: session.id })
      return
    }

    // Verify payment was actually successful and get payment details
    const paymentIntent = await stripeInstance.paymentIntents.retrieve(session.payment_intent as string)
    
    if (paymentIntent.status !== 'succeeded') {
      console.error(`Payment intent not successful: ${paymentIntent.status} for session ${session.id}`)
      return
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, credits_remaining, email')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      console.error('User not found for one-time purchase. User ID:', userId, 'Error:', profileError)
      return
    }

    // Add credits using secure function with proper locking
    const { data: creditResult, error: creditError } = await supabase.rpc('update_user_credits', {
      target_user_id: userId,
      credit_change: creditsToAdd,
      operation_type: 'one_time_purchase',
      payment_reference: paymentIntent.id
    })

    if (creditError || !creditResult?.[0]?.success) {
      console.error('Failed to add credits for one-time purchase:', creditError)
      throw new Error(`Credit operation failed: ${creditError?.message || 'Unknown error'}`)
    }

    // Record billing history for one-time purchase using safe function
    const { data: billingResult, error: billingError } = await supabase.rpc('record_billing_transaction', {
      p_user_id: userId,
      p_amount: (paymentIntent.amount_received || 0) / 100, // Convert cents to dollars
      p_credits_added: creditsToAdd,
      p_stripe_payment_intent_id: paymentIntent.id,
      p_stripe_session_id: session.id,
      p_billing_period_start: new Date().toISOString(),
      p_billing_period_end: null // One-time purchase, no billing period
    })

    if (billingError) {
      console.error('Failed to record one-time purchase billing history:', billingError)
      // Don't throw - purchase success should still proceed even if history fails
    }

    // Send confirmation email
    try {
      await sendOneTimePurchaseEmail(session.customer_details?.email || profile.email, creditsToAdd, paymentIntent.amount_received / 100)
    } catch (emailError) {
      console.error('Failed to send one-time purchase email:', emailError)
      // Don't throw - purchase success shouldn't fail due to email issues
    }

    console.log(`Successfully processed one-time purchase for user ${userId}: +${creditsToAdd} credits (Session: ${session.id})`)
  } catch (error) {
    console.error('Error processing one-time purchase:', error)
    throw error
  }
}

async function sendOneTimePurchaseEmail(email: string, creditsAdded: number, amountPaid: number) {
  try {
    await resend.emails.send({
      from: 'billing@songmint.app',
      to: email,
      subject: `🎵 Your ${creditsAdded} credits are ready!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #7c3aed;">Purchase Successful! 🎉</h2>
          <p>Thank you for your purchase! Your credits have been added to your account and are ready to use.</p>
          
          <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #1f2937;">What you received:</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li><strong>${creditsAdded} credits</strong> added to your account</li>
              <li>Each credit creates 1 song with 2 unique versions</li>
              <li>Credits never expire</li>
            </ul>
          </div>

          <div style="background: #ecfdf5; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 0; color: #065f46;"><strong>Amount paid: $${amountPaid.toFixed(2)}</strong></p>
          </div>

          <p>Ready to create your first song? <a href="https://songmint.app/create" style="color: #7c3aed;">Start creating now!</a></p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 14px; color: #6b7280;">
            Need help? Reply to this email or visit our <a href="https://songmint.app/support">support center</a>.
          </p>
        </div>
      `
    })
  } catch (error) {
    console.error('Failed to send one-time purchase email:', error)
    // Don't throw - purchase success shouldn't fail due to email issues
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
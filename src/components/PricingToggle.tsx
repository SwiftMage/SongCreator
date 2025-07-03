'use client'

import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'

interface PricingPlan {
  id: string
  name: string
  tagline: string
  price: string
  credits: string
  creditsDescription: string
  perSong?: string
  badge?: string
  badgeColor?: string
  features: string[]
  buttonText: string
  popular?: boolean
}

interface PricingToggleProps {
  onCheckout: (type: string) => Promise<void>
  isCheckoutLoading: string | null
}

export default function PricingToggle({ onCheckout, isCheckoutLoading }: PricingToggleProps) {
  const [activeTab, setActiveTab] = useState<'onetime' | 'monthly'>('onetime')

  const oneTimePlans: PricingPlan[] = [
    {
      id: 'starter',
      name: 'Starter',
      tagline: 'Great for trying it out',
      price: '$9',
      credits: '3 credits',
      creditsDescription: '3 credits → 3 songs',
      perSong: '$3.00 per song',
      features: [
        '2 unique versions per song',
        'AI-generated lyrics + original music',
        'MP3 downloads included',
        'Credits never expire'
      ],
      buttonText: 'Buy Now'
    },
    {
      id: 'creator',
      name: 'Creator',
      tagline: 'Perfect for gifts or creative play',
      price: '$19',
      credits: '10 credits',
      creditsDescription: '10 credits → 10 songs',
      perSong: '$1.90 per song',
      badge: 'Most Popular',
      badgeColor: 'bg-purple-600',
      features: [
        'Everything in Starter',
        'Best value for casual creators',
        'Great for special occasions or thoughtful gifts'
      ],
      buttonText: 'Buy Now',
      popular: true
    },
    {
      id: 'pro',
      name: 'Pro',
      tagline: 'Best for frequent creators',
      price: '$29',
      credits: '20 credits',
      creditsDescription: '20 credits → 20 songs',
      perSong: '$1.45 per song',
      features: [
        'Everything in Creator',
        'Ideal for journaling, practice, or creative bursts',
        'Save more with bulk credits'
      ],
      buttonText: 'Buy Now'
    }
  ]

  const monthlyPlans: PricingPlan[] = [
    {
      id: 'lite',
      name: 'Lite',
      tagline: 'Great for staying creative all month',
      price: '$10',
      credits: '5 credits',
      creditsDescription: '5 credits → 5 songs/month',
      perSong: '$2.00 per song',
      features: [
        '2 unique versions per song',
        'New credits every month',
        'Unused credits roll over',
        'AI-generated lyrics + original music',
        'MP3 downloads included'
      ],
      buttonText: 'Subscribe'
    },
    {
      id: 'plus',
      name: 'Plus',
      tagline: 'Perfect for gifts or regular creation',
      price: '$20',
      credits: '15 credits',
      creditsDescription: '15 credits → 15 songs/month',
      perSong: '$1.33 per song',
      badge: 'Best Value',
      badgeColor: 'bg-green-600',
      features: [
        'Everything in Lite',
        'Best value for casual creators',
        'Great for journaling, gifting, or creative expression'
      ],
      buttonText: 'Subscribe',
      popular: true
    },
    {
      id: 'max',
      name: 'Max',
      tagline: 'Made for frequent or high-volume creators',
      price: '$35',
      credits: '30 credits',
      creditsDescription: '30 credits → 30 songs/month',
      perSong: '$1.17 per song',
      features: [
        'Everything in Plus',
        'Ideal for songwriting practice, content creation, or daily use',
        'Save more with bulk monthly credits'
      ],
      buttonText: 'Subscribe'
    }
  ]

  const currentPlans = activeTab === 'onetime' ? oneTimePlans : monthlyPlans

  return (
    <div className="w-full">
      {/* Toggle */}
      <div className="flex justify-center mb-8 sm:mb-12 px-4">
        <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl inline-flex shadow-sm border border-gray-200 dark:border-gray-700 w-full max-w-md sm:w-auto">
          <button
            onClick={() => setActiveTab('onetime')}
            className={`flex-1 sm:flex-none px-3 sm:px-6 py-3 rounded-lg font-medium transition-all duration-200 text-xs sm:text-sm min-h-[48px] flex items-center justify-center ${
              activeTab === 'onetime'
                ? 'bg-white dark:bg-gray-700 text-purple-700 dark:text-white shadow-md border border-purple-200 dark:border-gray-600 ring-1 ring-purple-100 dark:ring-purple-900/50'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            <span className="hidden sm:inline">💳 One-Time Purchase</span>
            <span className="sm:hidden">💳 One-Time</span>
          </button>
          <button
            onClick={() => setActiveTab('monthly')}
            className={`flex-1 sm:flex-none px-3 sm:px-6 py-3 rounded-lg font-medium transition-all duration-200 text-xs sm:text-sm min-h-[48px] flex items-center justify-center ${
              activeTab === 'monthly'
                ? 'bg-white dark:bg-gray-700 text-purple-700 dark:text-white shadow-md border border-purple-200 dark:border-gray-600 ring-1 ring-purple-100 dark:ring-purple-900/50'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            <span className="hidden sm:inline">🔁 Monthly Subscription</span>
            <span className="sm:hidden">🔁 Monthly</span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-5xl mx-auto px-4 sm:px-0">
        {currentPlans.map((plan, index) => (
          <div
            key={plan.id}
            className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 transition-all duration-300 hover:shadow-xl hover:scale-105 animate-fadeIn cursor-pointer group ${
              plan.popular
                ? 'border-2 border-purple-500 dark:border-purple-400 sm:scale-105 ring-2 ring-purple-100 dark:ring-purple-900/50'
                : 'border border-gray-200 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-600'
            } ${activeTab === 'onetime' && plan.popular ? 'sm:col-span-2 lg:col-span-1' : ''}`}
            style={{
              animationDelay: `${index * 100}ms`,
              animationFillMode: 'backwards'
            }}
          >
            {/* Badge */}
            {plan.badge && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="brand-gradient text-white px-4 py-1.5 rounded-full text-sm font-semibold shadow-lg">
                  {plan.badge}
                </div>
              </div>
            )}

            {/* Plan Content */}
            <div className="text-center mb-6 sm:mb-8">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">{plan.name}</h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4">{plan.tagline}</p>
              <div className="text-3xl sm:text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                {plan.price}
                {activeTab === 'monthly' && <span className="text-base sm:text-lg font-normal">/month</span>}
              </div>
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 font-medium mb-1">{plan.creditsDescription}</p>
              {plan.perSong && (
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500">{plan.perSong}</p>
              )}
            </div>

            {/* Features */}
            <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start space-x-2 sm:space-x-3">
                  <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            {/* Button */}
            <button
              onClick={() => onCheckout(plan.id)}
              disabled={isCheckoutLoading === plan.id}
              className={`w-full py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] text-sm sm:text-base ${
                plan.popular
                  ? 'relative text-white overflow-hidden group'
                  : 'bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg group-hover:bg-purple-700'
              }`}
            >
              {plan.popular && (
                <span className="absolute inset-0 brand-gradient transition-transform group-hover:scale-110" />
              )}
              <span className={plan.popular ? "relative" : ""}>
                {isCheckoutLoading === plan.id ? (
                  <>
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                    <span className="hidden sm:inline">Processing...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  plan.buttonText
                )}
              </span>
            </button>
          </div>
        ))}
      </div>

      {/* Additional Info */}
      <div className="mt-8 sm:mt-12 text-center px-4">
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          {activeTab === 'onetime' 
            ? '✨ Credits never expire • Use them whenever you want'
            : '✨ Unused credits roll over • Cancel anytime'}
        </p>
      </div>
    </div>
  )
}
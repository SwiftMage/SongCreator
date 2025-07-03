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
      creditsDescription: '3 credits = 3 full songs',
      perSong: '$3.00 per song',
      features: [
        'AI lyric generation',
        'Professional music creation',
        'High-quality MP3 downloads',
        'Credits never expire'
      ],
      buttonText: 'Buy Now'
    },
    {
      id: 'creator',
      name: 'Creator',
      tagline: 'Most value for gifting or creating',
      price: '$19',
      credits: '10 credits',
      creditsDescription: '10 credits = 10 songs',
      perSong: '$1.90 per song',
      badge: 'Most Popular',
      badgeColor: 'bg-purple-600',
      features: [
        'Everything in Starter',
        'Best value per song',
        'Perfect for gifts',
        'Priority support'
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
      creditsDescription: '20 credits = 20 custom songs',
      perSong: '$1.45 per song',
      features: [
        'Everything in Creator',
        'Lowest cost per song',
        'Bulk song creation',
        'VIP support'
      ],
      buttonText: 'Buy Now'
    }
  ]

  const monthlyPlans: PricingPlan[] = [
    {
      id: 'lite',
      name: 'Lite',
      tagline: 'Perfect for casual creators',
      price: '$10',
      credits: '5 credits',
      creditsDescription: '5 credits = 5 songs per month',
      perSong: '$2.00 per song',
      features: [
        '5 credits per month',
        'Credits roll over',
        'Cancel anytime',
        'All features included'
      ],
      buttonText: 'Subscribe'
    },
    {
      id: 'plus',
      name: 'Plus',
      tagline: 'Best value for regular use',
      price: '$20',
      credits: '15 credits',
      creditsDescription: '15 credits = 15 songs per month',
      perSong: '$1.33 per song',
      badge: 'Best Value',
      badgeColor: 'bg-green-600',
      features: [
        '15 credits per month',
        'Credits roll over',
        'Priority processing',
        'Priority support'
      ],
      buttonText: 'Subscribe',
      popular: true
    },
    {
      id: 'pro-monthly',
      name: 'Pro',
      tagline: 'For power users and creators',
      price: '$35',
      credits: '30 credits',
      creditsDescription: '30 credits = 30 songs per month',
      perSong: '$1.17 per song',
      features: [
        '30 credits per month',
        'Credits roll over',
        'Fastest processing',
        'VIP support'
      ],
      buttonText: 'Subscribe'
    }
  ]

  const currentPlans = activeTab === 'onetime' ? oneTimePlans : monthlyPlans

  return (
    <div className="w-full">
      {/* Toggle */}
      <div className="flex justify-center mb-12">
        <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl inline-flex shadow-sm border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('onetime')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'onetime'
                ? 'bg-white dark:bg-gray-700 text-purple-700 dark:text-white shadow-md border border-purple-200 dark:border-gray-600 ring-1 ring-purple-100 dark:ring-purple-900/50'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            💳 One-Time Purchase
          </button>
          <button
            onClick={() => setActiveTab('monthly')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'monthly'
                ? 'bg-white dark:bg-gray-700 text-purple-700 dark:text-white shadow-md border border-purple-200 dark:border-gray-600 ring-1 ring-purple-100 dark:ring-purple-900/50'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            🔁 Monthly Subscription
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {currentPlans.map((plan, index) => (
          <div
            key={plan.id}
            className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 transition-all duration-300 hover:shadow-xl hover:scale-105 animate-fadeIn cursor-pointer group ${
              plan.popular
                ? 'border-2 border-purple-500 dark:border-purple-400 scale-105 ring-2 ring-purple-100 dark:ring-purple-900/50'
                : 'border border-gray-200 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-600'
            }`}
            style={{
              animationDelay: `${index * 100}ms`,
              animationFillMode: 'backwards'
            }}
          >
            {/* Badge */}
            {plan.badge && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className={`${plan.badgeColor} text-white px-4 py-1.5 rounded-full text-sm font-semibold shadow-lg`}>
                  {plan.badge}
                </div>
              </div>
            )}

            {/* Plan Content */}
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{plan.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{plan.tagline}</p>
              <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                {plan.price}
                {activeTab === 'monthly' && <span className="text-lg font-normal">/month</span>}
              </div>
              <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">{plan.creditsDescription}</p>
              {plan.perSong && (
                <p className="text-sm text-gray-500 dark:text-gray-500">{plan.perSong}</p>
              )}
            </div>

            {/* Features */}
            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300 text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            {/* Button */}
            <button
              onClick={() => onCheckout(plan.id)}
              disabled={isCheckoutLoading === plan.id}
              className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 transform hover:scale-105 ${
                plan.popular
                  ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg'
                  : 'bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg group-hover:bg-purple-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isCheckoutLoading === plan.id ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                plan.buttonText
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Additional Info */}
      <div className="mt-12 text-center">
        <p className="text-gray-600 dark:text-gray-400">
          {activeTab === 'onetime' 
            ? '✨ Credits never expire • Use them whenever you want'
            : '✨ Unused credits roll over • Cancel anytime'}
        </p>
      </div>
    </div>
  )
}
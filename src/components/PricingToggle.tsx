'use client'

import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'

interface PricingPlan {
  id: string
  name: string
  price: string
  credits: string
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
      price: '$9',
      credits: '3 credits',
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
      price: '$19',
      credits: '10 credits',
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
      price: '$29',
      credits: '20 credits',
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
      price: '$10',
      credits: '5 credits',
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
      price: '$20',
      credits: '15 credits',
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
      price: '$35',
      credits: '30 credits',
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
        <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl inline-flex">
          <button
            onClick={() => setActiveTab('onetime')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'onetime'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            💳 One-Time Purchase
          </button>
          <button
            onClick={() => setActiveTab('monthly')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'monthly'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
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
            className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 transition-all duration-300 hover:shadow-xl animate-fadeIn ${
              plan.popular
                ? 'border-2 border-purple-500 dark:border-purple-400 scale-105'
                : 'border border-gray-200 dark:border-gray-700'
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
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
              <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                {plan.price}
                {activeTab === 'monthly' && <span className="text-lg font-normal">/month</span>}
              </div>
              <p className="text-gray-600 dark:text-gray-400 font-medium">{plan.credits}</p>
              {plan.perSong && (
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">{plan.perSong}</p>
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
              className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                plan.popular
                  ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
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
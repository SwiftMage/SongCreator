import Link from "next/link";
import { Check, ArrowLeft } from "lucide-react";
import Logo from "@/components/Logo";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Logo />
            
            <Link 
              href="/dashboard"
              className="text-gray-600 hover:text-gray-900 flex items-center space-x-2 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-4">
            Create amazing personalized songs with our AI. Pick the plan that works best for you.
          </p>
          <div className="bg-purple-100 border border-purple-200 rounded-lg p-4 max-w-xl mx-auto">
            <p className="text-purple-800 font-medium">
              ✨ Each song comes with 2 unique versions - only 1 credit needed!
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Single Song */}
          <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Single Song</h3>
            <div className="text-4xl font-bold text-purple-600 mb-6">$9.99</div>
            <ul className="space-y-3 text-gray-600 mb-8">
              <li className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>1 custom AI-generated song</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-green-500" />
                <span className="font-medium text-purple-600">2 unique versions per song</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>High-quality audio download</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>Personalized lyrics</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>Multiple genre options</span>
              </li>
            </ul>
            <button className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors">
              Get Started
            </button>
          </div>

          {/* 3-Song Bundle */}
          <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-purple-500 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <div className="bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                Most Popular
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">3-Song Bundle</h3>
            <div className="text-4xl font-bold text-purple-600 mb-1">$24.99</div>
            <div className="text-gray-500 mb-6">$8.33 per song</div>
            <ul className="space-y-3 text-gray-600 mb-8">
              <li className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>3 custom AI-generated songs</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-green-500" />
                <span className="font-medium text-purple-600">2 unique versions per song (6 total)</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>High-quality audio downloads</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>Personalized lyrics for each</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>Multiple genre options</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>Save $5.00</span>
              </li>
            </ul>
            <button className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors">
              Get Bundle
            </button>
          </div>

          {/* 5-Song Bundle */}
          <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">5-Song Bundle</h3>
            <div className="text-4xl font-bold text-purple-600 mb-1">$39.99</div>
            <div className="text-gray-500 mb-6">$8.00 per song</div>
            <ul className="space-y-3 text-gray-600 mb-8">
              <li className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>5 custom AI-generated songs</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-green-500" />
                <span className="font-medium text-purple-600">2 unique versions per song (10 total)</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>High-quality audio downloads</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>Personalized lyrics for each</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>Multiple genre options</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>Save $10.00</span>
              </li>
            </ul>
            <button className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors">
              Get Bundle
            </button>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                How long does it take to generate a song?
              </h3>
              <p className="text-gray-600">
                Most songs are generated within 2-5 minutes after you complete the questionnaire. 
                You&apos;ll receive an email notification when your song is ready.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What audio format will I receive?
              </h3>
              <p className="text-gray-600">
                Your song will be delivered as a high-quality MP3 file that you can download 
                and share anywhere.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I request changes to my song?
              </h3>
              <p className="text-gray-600">
                Each song credit includes one generation. If you&apos;d like to try different 
                variations, you can create a new song with modified inputs.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Do song credits expire?
              </h3>
              <p className="text-gray-600">
                No! Your song credits never expire. Use them whenever you&apos;re ready to 
                create something special.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
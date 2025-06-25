import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import Logo from '@/components/Logo'
import DarkModeToggle from '@/components/DarkModeToggle'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Logo />
            
            <div className="flex items-center space-x-4">
              <DarkModeToggle />
              <Link 
                href="/"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center space-x-2 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Home</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Privacy Policy for SongMint.app</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Effective Date: {new Date().toLocaleDateString()}</p>
          
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="mb-6 text-gray-700 dark:text-gray-300">
              This Privacy Policy describes how SongMint.app ("we," "us," or "our") collects, uses, and protects your personal information when you use our website and services.
            </p>
            
            <p className="mb-8 text-gray-700 dark:text-gray-300">
              By accessing or using SongMint.app, you agree to this Privacy Policy. If you do not agree, please do not use our platform.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">1. Information We Collect</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">We collect the following types of information:</p>
            <ul className="list-disc ml-8 text-gray-700 dark:text-gray-300 mb-6 space-y-2">
              <li><strong>Personal Information</strong>: When you sign up, make a purchase, or contact us, we may collect your name, email address, payment information, and any other details you provide.</li>
              <li><strong>User Content</strong>: Lyrics or other content you upload, generate, or edit using our services.</li>
              <li><strong>Usage Data</strong>: Information about how you use our website, such as IP address, browser type, pages visited, and session duration.</li>
              <li><strong>Cookies</strong>: We use cookies and similar tracking technologies to enhance your experience and analyze usage.</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">2. How We Use Your Information</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">We use your information to:</p>
            <ul className="list-disc ml-8 text-gray-700 dark:text-gray-300 mb-6 space-y-1">
              <li>Provide and improve our services;</li>
              <li>Process transactions and send receipts;</li>
              <li>Store your lyrics and user content;</li>
              <li>Communicate with you about your account or updates;</li>
              <li>Enforce our Terms of Service;</li>
              <li>Comply with legal obligations.</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">3. Sharing of Information</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">We do not sell your personal information. We may share your information with:</p>
            <ul className="list-disc ml-8 text-gray-700 dark:text-gray-300 mb-6 space-y-2">
              <li><strong>Service Providers</strong>: Third parties who help us operate and improve our services (e.g., payment processors, hosting providers).</li>
              <li><strong>Legal Authorities</strong>: If required by law or to protect our rights and property.</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">4. User Content</h2>
            <p className="mb-6 text-gray-700 dark:text-gray-300">
              Lyrics or content you provide or generate may be stored on our platform. You are responsible for the content you upload. Please do not submit personal data within your lyrics.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">5. Data Retention</h2>
            <p className="mb-6 text-gray-700 dark:text-gray-300">
              We retain your information for as long as necessary to provide services and comply with legal obligations. You may request deletion of your account or data by contacting us through our <Link href="/support" className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 underline">support page</Link>.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">6. Your Rights</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">Depending on your jurisdiction, you may have rights to:</p>
            <ul className="list-disc ml-8 text-gray-700 dark:text-gray-300 mb-4 space-y-1">
              <li>Access your personal information;</li>
              <li>Request corrections or deletions;</li>
              <li>Object to or restrict processing;</li>
              <li>Withdraw consent.</li>
            </ul>
            <p className="mb-6 text-gray-700 dark:text-gray-300">
              To exercise these rights, contact us through our <Link href="/support" className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 underline">support page</Link>.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">7. Children's Privacy</h2>
            <p className="mb-6 text-gray-700 dark:text-gray-300">
              Our platform is not intended for children under 13. We do not knowingly collect personal information from children under 13.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">8. Data Security</h2>
            <p className="mb-6 text-gray-700 dark:text-gray-300">
              We implement reasonable measures to protect your information. However, no method of transmission or storage is 100% secure.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">9. International Transfers</h2>
            <p className="mb-6 text-gray-700 dark:text-gray-300">
              If you are accessing SongMint.app from outside the country where our servers are located, your data may be transferred across borders. By using our platform, you consent to such transfers.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">10. Third-Party Links</h2>
            <p className="mb-6 text-gray-700 dark:text-gray-300">
              Our website may contain links to external sites. We are not responsible for the content or privacy practices of those sites.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">11. Changes to This Policy</h2>
            <p className="mb-6 text-gray-700 dark:text-gray-300">
              We may update this Privacy Policy from time to time. Material changes will be posted on this page. Continued use of our services constitutes acceptance of the revised policy.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">12. Contact</h2>
            <p className="mb-8 text-gray-700 dark:text-gray-300">
              If you have any questions about this Privacy Policy or your data, contact us through our <Link href="/support" className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 underline">support page</Link>.
            </p>

            <hr className="my-8 border-gray-300 dark:border-gray-600" />

            <p className="mt-8 text-center font-semibold text-gray-900 dark:text-white">By using SongMint.app, you consent to this Privacy Policy.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
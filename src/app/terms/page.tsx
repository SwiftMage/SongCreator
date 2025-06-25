import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import Logo from '@/components/Logo'

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Logo />
            
            <Link 
              href="/"
              className="text-gray-600 hover:text-gray-900 flex items-center space-x-2 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service for SongMint.app</h1>
          <p className="text-gray-600 mb-6">Effective Date: {new Date().toLocaleDateString()}</p>
          
          <div className="prose prose-gray max-w-none">
            <p className="mb-6">
              Welcome to SongMint.app ("we," "us," or "our"). By using our website and services, you agree to the following Terms of Service ("Terms"). If you do not agree, please do not use our platform.
            </p>

            <hr className="my-8" />

            <h2 className="text-2xl font-semibold mt-8 mb-4">1. Eligibility</h2>
            <p>You must be at least 13 years old to use SongMint.app. If you are under 18, you must have a parent or guardian's permission.</p>

            <hr className="my-8" />

            <h2 className="text-2xl font-semibold mt-8 mb-4">2. Services Offered</h2>
            <p>SongMint.app allows users to generate song lyrics using AI and to input or edit their own lyrics. Some features require payment.</p>

            <hr className="my-8" />

            <h2 className="text-2xl font-semibold mt-8 mb-4">3. User Content</h2>
            <p>You retain ownership of any lyrics or content you submit or generate ("User Content").</p>
            <p className="mt-4">By using our service, you grant us a worldwide, non-exclusive, royalty-free license to host, store, display, and distribute your User Content in connection with the operation of our platform.</p>
            <p className="mt-4">You represent and warrant that:</p>
            <ul className="list-disc ml-8 mt-2">
              <li>You have the rights to submit, use, and share any User Content.</li>
              <li>Your User Content does not infringe any third-party copyright or intellectual property rights.</li>
            </ul>
            <p className="mt-4">You are solely responsible for any content you provide, and you agree to indemnify us against any claims related to copyright infringement or unauthorized use.</p>

            <hr className="my-8" />

            <h2 className="text-2xl font-semibold mt-8 mb-4">4. Prohibited Content and Conduct</h2>
            <p>You may not:</p>
            <ul className="list-disc ml-8 mt-2">
              <li>Submit copyrighted lyrics you do not have the right to use.</li>
              <li>Use the platform to distribute spam or malicious content.</li>
              <li>Attempt to disrupt or hack our service.</li>
            </ul>

            <hr className="my-8" />

            <h2 className="text-2xl font-semibold mt-8 mb-4">5. Fees and Payments</h2>
            <p>Some features on SongMint.app require payment. By making a purchase, you agree to our pricing and billing terms. All payments are final and non-refundable unless otherwise stated.</p>

            <hr className="my-8" />

            <h2 className="text-2xl font-semibold mt-8 mb-4">6. Intellectual Property</h2>
            <p>All non-user-generated content on SongMint.app, including code, interface, and AI models, is owned by us and protected by copyright and other laws.</p>

            <hr className="my-8" />

            <h2 className="text-2xl font-semibold mt-8 mb-4">7. Disclaimer of Warranties</h2>
            <p>The services are provided "as is" and "as available." We make no warranties, express or implied, including the implied warranties of merchantability or fitness for a particular purpose. We do not guarantee that the services will be secure, error-free, or uninterrupted.</p>

            <hr className="my-8" />

            <h2 className="text-2xl font-semibold mt-8 mb-4">8. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, we are not liable for any damages arising from your use of the site, including direct, indirect, incidental, punitive, or consequential damages, even if we have been advised of the possibility of such damages. This includes, but is not limited to, loss of data, content, or profits, or damages resulting from the use or inability to use the service.</p>

            <hr className="my-8" />

            <h2 className="text-2xl font-semibold mt-8 mb-4">9. Indemnification</h2>
            <p>You agree to defend, indemnify, and hold harmless SongMint.app and its affiliates, officers, agents, and employees from and against any claims, liabilities, damages, losses, and expenses, including legal and accounting fees, arising out of or in any way connected with:</p>
            <ul className="list-disc ml-8 mt-2">
              <li>Your access to or use of the services;</li>
              <li>Your User Content;</li>
              <li>Your violation of these Terms.</li>
            </ul>

            <hr className="my-8" />

            <h2 className="text-2xl font-semibold mt-8 mb-4">10. Third-Party Links and Services</h2>
            <p>The platform may contain links to third-party websites or services. We are not responsible for the content, policies, or practices of any third-party websites or services.</p>

            <hr className="my-8" />

            <h2 className="text-2xl font-semibold mt-8 mb-4">11. No Waiver</h2>
            <p>Our failure to enforce any right or provision of these Terms shall not be deemed a waiver of such right or provision.</p>

            <hr className="my-8" />

            <h2 className="text-2xl font-semibold mt-8 mb-4">12. Severability</h2>
            <p>If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary, and the remaining provisions will remain in full force and effect.</p>

            <hr className="my-8" />

            <h2 className="text-2xl font-semibold mt-8 mb-4">13. Termination</h2>
            <p>We reserve the right to suspend or terminate access to SongMint.app at our discretion, especially in cases of suspected violations of these Terms.</p>

            <hr className="my-8" />

            <h2 className="text-2xl font-semibold mt-8 mb-4">14. Copyright Infringement (DMCA)</h2>
            <p>If you believe that any content on SongMint.app infringes your copyright, please contact us through our <Link href="/support" className="text-purple-600 hover:text-purple-700 underline">support page</Link> with the details of your claim in accordance with the Digital Millennium Copyright Act (DMCA). We will investigate and, if appropriate, remove the allegedly infringing material.</p>

            <hr className="my-8" />

            <h2 className="text-2xl font-semibold mt-8 mb-4">15. User Accounts</h2>
            <p>You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. We reserve the right to suspend or terminate your account for any breach of these Terms.</p>

            <hr className="my-8" />

            <h2 className="text-2xl font-semibold mt-8 mb-4">16. AI Content Disclaimer</h2>
            <p>The lyrics generated by our AI are created automatically and may not be reviewed or verified for originality or legal compliance. We make no representations or warranties regarding the legal usability, originality, or suitability of AI-generated lyrics for commercial or personal purposes.</p>

            <hr className="my-8" />

            <h2 className="text-2xl font-semibold mt-8 mb-4">17. Legal Compliance</h2>
            <p>You agree to comply with all applicable laws, regulations, and export restrictions in connection with your use of the service.</p>

            <hr className="my-8" />

            <h2 className="text-2xl font-semibold mt-8 mb-4">18. Survival</h2>
            <p>The sections on User Content, Limitation of Liability, Indemnification, and Governing Law will survive the termination of these Terms.</p>

            <hr className="my-8" />

            <h2 className="text-2xl font-semibold mt-8 mb-4">19. Changes to These Terms</h2>
            <p>We may update these Terms from time to time. Continued use of the platform constitutes acceptance of the revised Terms.</p>

            <hr className="my-8" />

            <h2 className="text-2xl font-semibold mt-8 mb-4">20. Governing Law</h2>
            <p>These Terms shall be governed by the laws of the United States, without regard to conflict of law principles.</p>

            <hr className="my-8" />

            <h2 className="text-2xl font-semibold mt-8 mb-4">21. Entire Agreement</h2>
            <p>These Terms constitute the entire agreement between you and SongMint.app with respect to your use of the platform and supersede any prior agreements, oral or written.</p>

            <hr className="my-8" />

            <h2 className="text-2xl font-semibold mt-8 mb-4">22. Contact</h2>
            <p>If you have questions about these Terms, please contact us through our <Link href="/support" className="text-purple-600 hover:text-purple-700 underline">support page</Link></p>

            <hr className="my-8" />

            <p className="mt-8 text-center font-semibold">By using SongMint.app, you agree to these Terms.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
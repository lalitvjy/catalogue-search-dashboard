import Link from 'next/link'

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-sm rounded-lg p-8">
          <div className="mb-8">
            <Link 
              href="/login" 
              className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
            >
              ← Back to Login
            </Link>
          </div>

          <div className="prose prose-lg max-w-none">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
            <p className="text-sm text-gray-600 mb-8">
              <strong>Effective Date:</strong> September 13, 2025<br />
              <strong>Last Updated:</strong> September 13, 2025
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 mb-4">
                By accessing or using the MirrAR Catalogue Search Dashboard (the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you must not access or use the Service.
              </p>
              <p className="text-gray-700">
                These Terms constitute a legally binding agreement between you and Styledotme Fashion and Lifestyle Private Limited ("MirrAR," "we," "us," or "our").
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
              <p className="text-gray-700 mb-4">
                The MirrAR Catalogue Search Dashboard is a B2B internal tool that provides:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Image similarity search functionality using vector embeddings</li>
                <li>SKU management with product attributes</li>
                <li>Multi-tenant brand-scoped data access</li>
                <li>Filter capabilities for product categories, types, occasions, and specifications</li>
                <li>One-click SKU copying functionality</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Eligibility and Access</h2>
              <h3 className="text-xl font-medium text-gray-900 mb-3">3.1 Authorized Users</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>The Service is intended exclusively for authorized business users and partners of MirrAR</li>
                <li>Access is granted on a per-organization basis with brand-specific data isolation</li>
                <li>Users must be authenticated through approved Microsoft Azure AD or Google OAuth credentials</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">3.2 Account Security</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>You are responsible for maintaining the confidentiality of your login credentials</li>
                <li>You must notify us immediately of any unauthorized access to your account</li>
                <li>You are solely responsible for all activities that occur under your account</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Intellectual Property Rights</h2>
              <h3 className="text-xl font-medium text-gray-900 mb-3">4.1 MirrAR's Rights</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>All rights, title, and interest in the Service, including all intellectual property rights, are owned by MirrAR</li>
                <li>The Service contains proprietary and confidential information protected by applicable intellectual property laws</li>
                <li>No rights are granted to you other than the limited right to use the Service as set forth in these Terms</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">4.2 User Content</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>You retain ownership of any product images, SKU data, or other content you upload to the Service</li>
                <li>By uploading content, you grant MirrAR a non-exclusive, worldwide, royalty-free license to use, process, and analyze such content solely for providing the Service</li>
                <li>You represent and warrant that you have all necessary rights to upload and use any content through the Service</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Acceptable Use</h2>
              <h3 className="text-xl font-medium text-gray-900 mb-3">5.1 Permitted Use</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Use the Service solely for legitimate business purposes related to product catalogue management</li>
                <li>Access only data belonging to your authorized brand/organization</li>
                <li>Comply with all applicable laws and regulations</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">5.2 Prohibited Activities</h3>
              <p className="text-gray-700 mb-2">You may not:</p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Access or attempt to access data belonging to other brands or organizations</li>
                <li>Reverse engineer, decompile, or attempt to extract the source code of the Service</li>
                <li>Use the Service for any unlawful purpose or in violation of any applicable laws</li>
                <li>Interfere with or disrupt the integrity or performance of the Service</li>
                <li>Attempt to gain unauthorized access to the Service or its related systems</li>
                <li>Share your access credentials with unauthorized third parties</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data and Privacy</h2>
              <h3 className="text-xl font-medium text-gray-900 mb-3">6.1 Multi-Tenant Architecture</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>All data is strictly segregated by brand/organization</li>
                <li>Users can only access data belonging to their assigned brand</li>
                <li>Cross-brand data access is technically and administratively prevented</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">6.2 Data Processing</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Product images and metadata are processed using AI/ML algorithms for similarity matching</li>
                <li>Vector embeddings are generated and stored for search functionality</li>
                <li>All processing is performed in accordance with our <Link href="/privacy" className="text-indigo-600 hover:text-indigo-500">Privacy Policy</Link></li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Limitation of Liability</h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                <h3 className="text-xl font-medium text-gray-900 mb-3">7.1 Disclaimer</h3>
                <p className="text-gray-700 font-medium">
                  THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.
                </p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <h3 className="text-xl font-medium text-gray-900 mb-3">7.2 Liability Limits</h3>
                <p className="text-gray-700 font-medium">
                  IN NO EVENT SHALL MIRRAR BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT PAID BY YOU FOR THE SERVICE IN THE 12 MONTHS PRECEDING THE CLAIM.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Governing Law</h2>
              <p className="text-gray-700">
                These Terms shall be governed by and construed in accordance with the laws of India, without regard to conflict of law principles. Any disputes shall be subject to the exclusive jurisdiction of the courts in Bangalore, India.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Contact Information</h2>
              <div className="bg-gray-50 rounded-md p-4">
                <p className="text-gray-700 mb-2">
                  For questions about these Terms, please contact:
                </p>
                <p className="text-gray-700">
                  <strong>Styledotme Fashion and Lifestyle Private Limited (MirrAR)</strong><br />
                  Email: legal@mirrar.com<br />
                  Website: <a href="https://www.mirrar.com" className="text-indigo-600 hover:text-indigo-500">www.mirrar.com</a>
                </p>
              </div>
            </section>

            <div className="border-t border-gray-200 pt-6">
              <p className="text-sm text-gray-600 italic">
                By using the MirrAR Catalogue Search Dashboard, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

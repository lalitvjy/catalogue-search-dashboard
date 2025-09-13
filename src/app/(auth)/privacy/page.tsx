import Link from 'next/link'

export default function PrivacyPolicy() {
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
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
            <p className="text-sm text-gray-600 mb-8">
              <strong>Effective Date:</strong> September 13, 2025<br />
              <strong>Last Updated:</strong> September 13, 2025
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 mb-4">
                Styledotme Fashion and Lifestyle Private Limited ("MirrAR," "we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use the MirrAR Catalogue Search Dashboard (the "Service").
              </p>
              <p className="text-gray-700">
                By accessing or using the Service, you consent to the collection, storage, and use of your information as outlined in this Privacy Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">2.1 Personal Information</h3>
              <p className="text-gray-700 mb-2">We may collect the following personal information:</p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li><strong>Authentication Data:</strong> Email address, name, and organizational affiliation through Microsoft Azure AD or Google OAuth</li>
                <li><strong>Profile Information:</strong> User ID, display name, and associated brand/organization details</li>
                <li><strong>Account Information:</strong> Login timestamps, session data, and access logs</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">2.2 Business Data</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li><strong>Product Images:</strong> Images uploaded for similarity search and analysis</li>
                <li><strong>SKU Information:</strong> Product codes, descriptions, categories, and attributes</li>
                <li><strong>Search Queries:</strong> Image search requests and filter parameters</li>
                <li><strong>Usage Analytics:</strong> Feature usage patterns, search performance metrics, and system interactions</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">2.3 Technical Information</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li><strong>Device Information:</strong> IP address, browser type, operating system, and device identifiers</li>
                <li><strong>Log Data:</strong> Server logs, error reports, and performance metrics</li>
                <li><strong>Cookies and Tracking:</strong> Session cookies for authentication and functionality (no advertising cookies)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">3.1 Service Provision</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Authenticate users and maintain secure access</li>
                <li>Process image similarity searches using AI/ML algorithms</li>
                <li>Generate and store vector embeddings for search functionality</li>
                <li>Provide SKU management and filtering capabilities</li>
                <li>Maintain multi-tenant data isolation and security</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">3.2 Service Improvement</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Monitor and analyze usage patterns to improve Service performance</li>
                <li>Develop new features and enhance existing functionality</li>
                <li>Conduct research and development for AI/ML capabilities</li>
                <li>Optimize search algorithms and accuracy</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data Processing and Storage</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">4.1 AI/ML Processing</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li><strong>Vector Embeddings:</strong> Product images are processed to generate mathematical representations (embeddings) for similarity matching</li>
                  <li><strong>Search Algorithms:</strong> AI algorithms analyze image features to provide relevant search results</li>
                  <li><strong>Data Enhancement:</strong> Machine learning models may be trained to improve search accuracy and relevance</li>
                </ul>
              </div>

              <h3 className="text-xl font-medium text-gray-900 mb-3">4.2 Multi-Tenant Architecture</h3>
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li><strong>Brand Isolation:</strong> All data is strictly segregated by brand/organization</li>
                  <li><strong>Access Controls:</strong> Users can only access data belonging to their assigned brand</li>
                  <li><strong>Database Scoping:</strong> Technical measures ensure cross-brand data access is prevented</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Information Sharing and Disclosure</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">5.1 Third-Party Service Providers</h3>
              <p className="text-gray-700 mb-2">We may share information with trusted third parties who assist in Service operations:</p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li><strong>Cloud Hosting Providers:</strong> For infrastructure and data storage</li>
                <li><strong>Authentication Services:</strong> Microsoft Azure AD and Google for user authentication</li>
                <li><strong>Analytics Providers:</strong> For Service monitoring and improvement</li>
                <li><strong>AI/ML Services:</strong> For image processing and similarity matching</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">5.2 Legal Requirements</h3>
              <p className="text-gray-700 mb-2">We may disclose information when required by law or to:</p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Comply with legal processes, court orders, or government requests</li>
                <li>Protect our rights, property, or safety, or that of our users</li>
                <li>Investigate and prevent fraud, security breaches, or illegal activities</li>
                <li>Enforce our <Link href="/terms" className="text-indigo-600 hover:text-indigo-500">Terms of Service</Link> and other agreements</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Security</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">6.1 Security Measures</h3>
              <p className="text-gray-700 mb-2">We implement appropriate technical and organizational measures to protect your information:</p>
              <div className="bg-gray-50 rounded-md p-4 mb-4">
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li><strong>Encryption:</strong> Data transmission and storage encryption using industry-standard protocols</li>
                  <li><strong>Access Controls:</strong> Role-based access controls and multi-factor authentication</li>
                  <li><strong>Network Security:</strong> Firewalls, intrusion detection, and secure network configurations</li>
                  <li><strong>Regular Audits:</strong> Security assessments and vulnerability testing</li>
                </ul>
              </div>

              <h3 className="text-xl font-medium text-gray-900 mb-3">6.2 Data Breach Response</h3>
              <p className="text-gray-700 mb-2">In the event of a data breach:</p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>We will investigate and contain the breach promptly</li>
                <li>Affected users will be notified in accordance with applicable laws</li>
                <li>Regulatory authorities will be notified as required</li>
                <li>Remedial measures will be implemented to prevent future incidents</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Your Rights and Choices</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">7.1 Access and Control</h3>
              <p className="text-gray-700 mb-2">You have the right to:</p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li><strong>Access:</strong> Request information about the personal data we hold about you</li>
                <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal data, subject to legal and business requirements</li>
                <li><strong>Portability:</strong> Request a copy of your data in a structured, machine-readable format</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">7.2 Consent Withdrawal</h3>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>You may withdraw consent for data processing by discontinuing use of the Service</li>
                <li>Contact us to request account deactivation and data deletion</li>
                <li>Some data may be retained for legal compliance and legitimate business purposes</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. International Data Transfers</h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <h3 className="text-xl font-medium text-gray-900 mb-3">8.1 Cross-Border Processing</h3>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li>Your information may be processed in countries other than your country of residence</li>
                  <li>We ensure appropriate safeguards are in place for international transfers</li>
                  <li>Data processing agreements include adequate protection measures</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-900 mb-3">8.2 Compliance Frameworks</h3>
                <p className="text-gray-700 mb-2">We comply with applicable data protection frameworks including:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>General Data Protection Regulation (GDPR) for EU users</li>
                  <li>Information Technology Act, 2000 and associated rules for Indian users</li>
                  <li>Other applicable local data protection laws</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Cookies and Tracking Technologies</h2>
              
              <h3 className="text-xl font-medium text-gray-900 mb-3">9.1 Essential Cookies</h3>
              <p className="text-gray-700 mb-2">We use essential cookies for:</p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>User authentication and session management</li>
                <li>Security and fraud prevention</li>
                <li>Service functionality and performance</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 mb-3">9.2 Analytics</h3>
              <p className="text-gray-700">
                We may use analytics tools to understand Service usage and improve performance. These tools may use cookies and similar technologies to collect usage information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Contact Information</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-md p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Privacy Inquiries</h3>
                  <p className="text-gray-700 text-sm mb-2">
                    For questions about this Privacy Policy or our privacy practices:
                  </p>
                  <p className="text-gray-700 text-sm">
                    <strong>Privacy Officer</strong><br />
                    Styledotme Fashion and Lifestyle Private Limited (MirrAR)<br />
                    Email: privacy@mirrar.com<br />
                    Website: <a href="https://www.mirrar.com" className="text-indigo-600 hover:text-indigo-500">www.mirrar.com</a>
                  </p>
                </div>

                <div className="bg-blue-50 rounded-md p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Data Protection Officer</h3>
                  <p className="text-gray-700 text-sm mb-2">
                    If you are in the EU, you may contact our Data Protection Officer:
                  </p>
                  <p className="text-gray-700 text-sm">
                    Email: dpo@mirrar.com
                  </p>
                  <p className="text-gray-700 text-sm mt-3">
                    You have the right to lodge complaints with relevant data protection authorities in your jurisdiction.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Updates to This Privacy Policy</h2>
              <p className="text-gray-700 mb-2">
                We may update this Privacy Policy from time to time to reflect changes in our practices or applicable laws. We will:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Post the updated Privacy Policy on the Service</li>
                <li>Notify users of material changes through the Service or email</li>
                <li>Indicate the effective date of changes</li>
              </ul>
              <p className="text-gray-700">
                Your continued use of the Service after such updates constitutes acceptance of the revised Privacy Policy.
              </p>
            </section>

            <div className="border-t border-gray-200 pt-6">
              <p className="text-sm text-gray-600 italic">
                By using the MirrAR Catalogue Search Dashboard, you acknowledge that you have read, understood, and consent to the practices described in this Privacy Policy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

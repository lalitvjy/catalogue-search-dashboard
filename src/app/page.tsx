'use client'
import Link from 'next/link'
import { ArrowRightIcon, MagnifyingGlassIcon, PhotoIcon, CheckIcon, PlayIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import posthog from 'posthog-js'

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <MagnifyingGlassIcon className="h-5 w-5 text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  mirr<span className="text-blue-600">AR</span>
                </div>
              </div>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                Features
              </Link>
              <Link href="#pricing" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                Pricing
              </Link>
              <Link href="#demo" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                Demo
              </Link>
            </div>
            
            {/* Desktop CTA Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <Link
                href="/login"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                onClick={() => posthog.capture('signin_landing', { location: 'desktop_nav' })}
              >
                Sign In
              </Link>
              <Link
                href="/login"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                onClick={() => posthog.capture('get_started', { location: 'desktop_nav' })}
              >
                Get Started
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                type="button"
                className="text-gray-600 hover:text-gray-900 p-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-100">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <Link
                  href="#features"
                  className="block px-3 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Features
                </Link>
                <Link
                  href="#pricing"
                  className="block px-3 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Pricing
                </Link>
                <Link
                  href="#demo"
                  className="block px-3 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Demo
                </Link>
                <div className="pt-2 border-t border-gray-100">
                  <Link
                    href="/login"
                    className="block px-3 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium"
                    onClick={() => {
                      posthog.capture('signin_landing', { location: 'mobile_nav' })
                      setMobileMenuOpen(false)
                    }}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/login"
                    className="block mx-3 mt-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-all duration-200 text-center"
                    onClick={() => {
                      posthog.capture('get_started', { location: 'mobile_nav' })
                      setMobileMenuOpen(false)
                    }}
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-purple-50/30"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 lg:pt-32 lg:pb-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-sm font-medium mb-6">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Trusted by leading jewellers across India & USA
              </div>
              
              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                Find Any Design.
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  Close Every Sale.
                </span>
              </h1>
              
              {/* Subtitle */}
              <p className="text-xl text-gray-600 mb-6 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                The fastest way for jewellery retailers & manufacturers to organize, search, and sell from their entire catalogue.
              </p>
              
              {/* Team Benefits */}
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Save your <span className="font-semibold text-gray-800">designers</span>, <span className="font-semibold text-gray-800">CAD teams</span>, <span className="font-semibold text-gray-800">merchandising</span> and <span className="font-semibold text-gray-800">sales teams</span> hours every week.
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-12 justify-center lg:justify-start">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center px-6 sm:px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-center"
                  onClick={() => posthog.capture('get_started', { location: 'hero_demo' })}
                >
                  <PlayIcon className="h-5 w-5 mr-2 flex-shrink-0" />
                  <span className="text-sm sm:text-base">Book a 30-min Demo</span>
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center px-4 sm:px-6 py-4 bg-white hover:bg-gray-50 text-gray-900 font-semibold rounded-lg border border-gray-200 transition-all duration-200 shadow-sm hover:shadow-md text-center"
                  onClick={() => posthog.capture('get_started', { location: 'hero_start_now' })}
                >
                  <span className="text-sm sm:text-base">Start Now – 30-Day Money-Back Guarantee</span>
                  <ArrowRightIcon className="h-5 w-5 ml-2 flex-shrink-0" />
                </Link>
              </div>
              
              {/* ROI Indicators */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 max-w-4xl mx-auto lg:mx-0">
                <div className="text-center lg:text-left bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <div className="font-bold text-2xl text-blue-600 mb-1">2x faster</div>
                  <div className="text-gray-600 text-sm font-medium">sales presentations</div>
                </div>
                <div className="text-center lg:text-left bg-green-50 rounded-xl p-4 border border-green-100">
                  <div className="font-bold text-2xl text-green-600 mb-1">50% less</div>
                  <div className="text-gray-600 text-sm font-medium">catalog maintenance</div>
                </div>
                <div className="text-center lg:text-left bg-purple-50 rounded-xl p-4 border border-purple-100">
                  <div className="font-bold text-2xl text-purple-600 mb-1">85-95%</div>
                  <div className="text-gray-600 text-sm font-medium">fewer duplicates</div>
                </div>
                <div className="text-center lg:text-left bg-orange-50 rounded-xl p-4 border border-orange-100">
                  <div className="font-bold text-2xl text-orange-600 mb-1">10-20%</div>
                  <div className="text-gray-600 text-sm font-medium">higher conversion</div>
                </div>
              </div>
            </div>

            {/* Right Content - Demo Interface */}
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                {/* Browser Header */}
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <div className="ml-4 text-sm text-gray-600 font-medium">mirrAR Visual Search</div>
                  </div>
                </div>
                
                {/* Demo Interface */}
                <div className="p-8">
                  {/* Upload Area */}
                  <div className="border-2 border-dashed border-blue-200 rounded-xl p-8 text-center bg-blue-50/50 mb-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <PhotoIcon className="h-8 w-8 text-blue-600" />
                    </div>
                    <p className="text-blue-700 font-medium mb-2">Upload product image</p>
                    <p className="text-sm text-gray-600">Drag & drop or click to browse</p>
                  </div>
                  
                  {/* Results Preview */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">Similar Products</span>
                      <span className="text-sm text-green-600 font-medium">3 matches found in 0.2 seconds</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      {[95, 92, 89].map((percentage, index) => (
                        <div key={index} className="relative bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg mb-3"></div>
                          <div className="absolute top-2 right-2">
                            <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                              {percentage}%
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 text-center">Product {index + 1}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating AI Badge */}
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                AI
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enterprise Trust & Security Section */}
      <div className="py-16 bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Enterprise-Grade Security & Trust
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Your data security is our top priority. Built for enterprise customers who demand the highest standards.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Security Feature 1 */}
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">End-to-End Encryption</h3>
              <p className="text-blue-100 text-sm">
                All data encrypted in transit and at rest using industry-standard AES-256 encryption
              </p>
            </div>

            {/* Security Feature 2 */}
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">SOC 2 Type II Compliant</h3>
              <p className="text-blue-100 text-sm">
                Audited security controls and compliance with international data protection standards
              </p>
            </div>

            {/* Security Feature 3 */}
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Your Data, Your Control</h3>
              <p className="text-blue-100 text-sm">
                Complete data ownership with options for on-premise deployment and custom data retention policies
              </p>
            </div>
          </div>

          {/* Enterprise CTA */}
          <div className="text-center mt-12">
            <div className="inline-flex items-center px-6 py-3 bg-white/20 rounded-full text-white text-sm font-medium mb-4">
              <CheckIcon className="h-4 w-4 mr-2" />
              Trusted by Fortune 500 jewelry companies
            </div>
            <p className="text-blue-100 text-lg">
              Need custom security requirements? Our enterprise team can work with your IT department to ensure complete compliance.
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div id="pricing" className="py-24 bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              Simple, Transparent Pricing
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Transparent, simple,
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                risk-free pricing
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              50% below market rates. All plans include 30-day money-back guarantee.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-6">
            {/* Core Plan */}
            <div className="relative bg-white rounded-2xl border border-gray-200 p-8 shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Core</h3>
                <div className="flex items-baseline mb-4">
                  <span className="text-4xl font-bold text-gray-900">$250</span>
                  <span className="text-gray-600 ml-2">per month</span>
                </div>
                <p className="text-gray-600">Best for mid-sized brands (up to 50K SKUs)</p>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Up to 50K SKUs</span>
                </li>
                <li className="flex items-center">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">AI-powered visual search</span>
                </li>
                <li className="flex items-center">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">WhatsApp & email sharing</span>
                </li>
                <li className="flex items-center">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Basic analytics dashboard</span>
                </li>
                <li className="flex items-center">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Email support</span>
                </li>
              </ul>

              <Link
                href="/login"
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 text-center block"
                onClick={() => posthog.capture('get_started', { location: 'pricing_core' })}
              >
                Start Now Risk-Free
              </Link>
            </div>

            {/* Pro Plan - Most Popular */}
            <div className="relative bg-white rounded-2xl border-2 border-blue-500 p-8 shadow-xl lg:transform lg:scale-105">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
                  ⭐ Most Popular
                </span>
              </div>
              
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Pro</h3>
                <div className="flex items-baseline mb-4">
                  <span className="text-4xl font-bold text-gray-900">$600</span>
                  <span className="text-gray-600 ml-2">per month</span>
                </div>
                <p className="text-gray-600">Larger chains (200K SKUs, integrations)</p>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Up to 200K SKUs</span>
                </li>
                <li className="flex items-center">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Advanced AI search & filters</span>
                </li>
                <li className="flex items-center">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">API integrations</span>
                </li>
                <li className="flex items-center">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Advanced analytics & insights</span>
                </li>
                <li className="flex items-center">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Priority support</span>
                </li>
                <li className="flex items-center">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Team collaboration tools</span>
                </li>
              </ul>

              <Link
                href="/login"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 text-center block shadow-lg hover:shadow-xl"
                onClick={() => posthog.capture('get_started', { location: 'pricing_pro' })}
              >
                Start Now Risk-Free
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="relative bg-white rounded-2xl border border-gray-200 p-8 shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Enterprise</h3>
                <div className="flex items-baseline mb-4">
                  <span className="text-2xl font-bold text-gray-900">From</span>
                  <span className="text-4xl font-bold text-gray-900 ml-2">$1,200</span>
                  <span className="text-gray-600 ml-2">per month</span>
                </div>
                <p className="text-gray-600">Full scale, unlimited SKUs, ERP sync</p>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Unlimited SKUs</span>
                </li>
                <li className="flex items-center">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Enterprise-grade security & encryption</span>
                </li>
                <li className="flex items-center">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">On-premise deployment options</span>
                </li>
                <li className="flex items-center">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Custom ERP integrations</span>
                </li>
                <li className="flex items-center">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Dedicated account manager & 24/7 support</span>
                </li>
                <li className="flex items-center">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">SOC 2 compliance & SLA guarantee</span>
                </li>
              </ul>

              <Link
                href="/login"
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 text-center block"
                onClick={() => posthog.capture('get_started', { location: 'pricing_enterprise' })}
              >
                Contact Sales
              </Link>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="text-center mt-16">
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl mb-6"
              onClick={() => posthog.capture('get_started', { location: 'pricing_bottom' })}
            >
              Start Now – 30-Day Money-Back Guarantee
            </Link>
            <p className="text-gray-600">
              All plans include 30-day money-back guarantee • No setup fees • Cancel anytime
            </p>
          </div>
        </div>
      </div>

      {/* Why search.mirrar.io Section */}
      <div id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why search.mirrar.io?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Built specifically for jewellery businesses to solve real sales and operational challenges
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Benefit 1 */}
            <div className="text-center group hover:bg-blue-50 p-6 rounded-2xl transition-all duration-300">
              <div className="bg-blue-100 rounded-2xl p-4 w-16 h-16 mx-auto mb-6 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Close Sales Faster</h3>
              <p className="text-gray-600 leading-relaxed">
                Show the right design in seconds, not minutes. Impress customers with instant results.
              </p>
            </div>

            {/* Benefit 2 */}
            <div className="text-center group hover:bg-green-50 p-6 rounded-2xl transition-all duration-300">
              <div className="bg-green-100 rounded-2xl p-4 w-16 h-16 mx-auto mb-6 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Save Team Hours Weekly</h3>
              <p className="text-gray-600 leading-relaxed">
                Free up your designers, CAD teams, merchandising & sales staff from catalog hunting. Focus on creativity and selling.
              </p>
            </div>

            {/* Benefit 3 */}
            <div className="text-center group hover:bg-purple-50 p-6 rounded-2xl transition-all duration-300">
              <div className="bg-purple-100 rounded-2xl p-4 w-16 h-16 mx-auto mb-6 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Avoid Costly Duplication</h3>
              <p className="text-gray-600 leading-relaxed">
                Instantly check if a design already exists. Prevent expensive duplicate inventory.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Get started in minutes, see results immediately
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                1
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Upload or sync your catalogue</h3>
              <p className="text-sm text-gray-600">Import your existing jewelry designs and product data</p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                2
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Search by image, text, or attributes</h3>
              <p className="text-sm text-gray-600">Find similar designs using AI-powered visual search</p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                3
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Share designs instantly</h3>
              <p className="text-sm text-gray-600">Send via WhatsApp, email, or show directly to customers</p>
            </div>

            {/* Step 4 */}
            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                4
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">See insights on performance</h3>
              <p className="text-sm text-gray-600">Track top & slow movers, optimize your inventory</p>
            </div>
          </div>
        </div>
      </div>

      {/* Social Proof Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-lg text-gray-600 mb-8">
            Trusted by leading jewellers across India & USA
          </p>
          <div className="bg-white rounded-2xl p-8 max-w-3xl mx-auto shadow-sm border border-gray-100">
            <blockquote className="text-xl text-gray-900 italic mb-6">
              &ldquo;With search.mirrar.io, our sales team shows designs in seconds. Customers are impressed — and we close more deals.&rdquo;
            </blockquote>
            <div className="flex items-center justify-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-blue-600 font-bold text-lg">R</span>
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">Rajesh Kumar</p>
                <p className="text-gray-600">Sales Director, Premium Jewels</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Your designs deserve to be found.
            <span className="block">Your sales team deserves speed.</span>
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join leading jewellery businesses already transforming their sales process
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-8 py-4 bg-white hover:bg-gray-50 text-blue-700 font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              onClick={() => posthog.capture('get_started', { location: 'final_cta_demo' })}
            >
              <PlayIcon className="h-5 w-5 mr-2" />
              Book a Demo – 30 Minutes
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-8 py-4 bg-blue-800 hover:bg-blue-900 text-white font-semibold rounded-lg border border-blue-500 transition-all duration-200 shadow-lg hover:shadow-xl"
              onClick={() => posthog.capture('get_started', { location: 'final_cta_start' })}
            >
              Start Now Risk-Free
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="text-2xl font-bold mb-4">
                mirr<span className="text-blue-400">AR</span>
              </div>
              <p className="text-gray-400 mb-4">
                AI-powered catalogue similarity search for modern B2B teams.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/login" className="hover:text-white">Search Dashboard</Link></li>
                <li><Link href="#features" className="hover:text-white">Features</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} mirrAR. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-3">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
            
            {/* Copyright */}
            <span>
              &copy; {new Date().getFullYear()} mirrAR catalogue search
            </span>
            
            {/* Separator */}
            <span className="hidden sm:inline text-gray-300">•</span>
            
            {/* Powered by */}
            <div className="flex items-center space-x-1.5">
              <span>Powered by</span>
              <a 
                href="https://mirrar.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200 group"
              >
                <span>mirrAR.com</span>
                <svg 
                  className="w-3 h-3 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
                  />
                </svg>
              </a>
            </div>
            
            {/* Separator */}
            <span className="hidden sm:inline text-gray-300">•</span>
            
            {/* Links */}
            <div className="flex items-center space-x-4">
              <a 
                href="/privacy" 
                className="hover:text-gray-700 transition-colors duration-200"
              >
                Privacy Policy
              </a>
              <a 
                href="/terms" 
                className="hover:text-gray-700 transition-colors duration-200"
              >
                Terms of Service
              </a>
              <a 
                href="https://www.mirrar.com/contact-us" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-gray-700 transition-colors duration-200"
              >
                Support
              </a>
            </div>
            
          </div>
        </div>
      </div>
    </footer>
  )
}

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Providers from '@/components/Providers'
import Footer from '@/components/Footer'
import FeedbackButton from '@/components/FeedbackButton'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'mirrAR Catalogue Search Dashboard',
  description: 'Multi-tenant catalogue similarity search app',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <Providers>
          <div className="flex-1">
            {children}
          </div>
          <Footer />
          <FeedbackButton />
        </Providers>
      </body>
    </html>
  )
}

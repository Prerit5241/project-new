import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from './context/AuthContext'
import { Toaster } from 'react-hot-toast'
import Header from '../components/Header'
import Footer from '../components/Footer'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

// Separate viewport export (required in Next.js 14+)
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f97316' },
    { media: '(prefers-color-scheme: dark)', color: '#1a202c' },
  ],
}

// Clean metadata export without viewport and themeColor
export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'),
  title: 'CodeShelf - Learn From Expert Instructors',
  description: 'Join thousands of students learning from industry experts. Master new skills and advance your career with our comprehensive online courses.',
  keywords: 'online learning, education, courses, skills development, professional training, certification, codeshelf',
  authors: [{ name: 'CodeShelf Team' }],
  creator: 'Prerit Thakur',
  publisher: 'CodeShelf',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://codeshelf.com',
    siteName: 'CodeShelf',
    title: 'CodeShelf - Learn From Expert Instructors',
    description: 'Join thousands of students learning from industry experts.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CodeShelf',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CodeShelf - Learn From Expert Instructors',
    description: 'Join thousands of students learning from industry experts.',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} antialiased min-h-screen flex flex-col`}>
        <AuthProvider>
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
          <Toaster
            position="top-right"
            reverseOrder={false}
            gutter={8}
            containerStyle={{
              zIndex: 9999,
            }}
            toastOptions={{
              className: 'toast-custom',
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
                borderRadius: '12px',
                padding: '16px',
                fontSize: '14px',
                fontWeight: '500',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                maxWidth: '500px',
              },
              success: {
                duration: 3000,
                style: {
                  background: '#10b981',
                  color: '#ffffff',
                },
                iconTheme: {
                  primary: '#ffffff',
                  secondary: '#10b981',
                },
              },
              error: {
                duration: 5000,
                style: {
                  background: '#ef4444',
                  color: '#ffffff',
                },
                iconTheme: {
                  primary: '#ffffff',
                  secondary: '#ef4444',
                },
              },
              loading: {
                style: {
                  background: '#3b82f6',
                  color: '#ffffff',
                },
                iconTheme: {
                  primary: '#ffffff',
                  secondary: '#3b82f6',
                },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { MSWProvider } from '@/components/providers/MSWProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sumarizz - Nature Paper Stories',
  description: 'Turn Nature paper summaries into interactive Storybook stories',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <MSWProvider>
          <div className="min-h-screen bg-background">
            {children}
          </div>
        </MSWProvider>
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import { DM_Sans, DM_Mono } from 'next/font/google'
import './globals.css'

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-sans' })
const dmMono = DM_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'FixTok – TikTok Audio Sync Fixer',
  description: 'Fix audio sync issues in TikTok videos. Process MOV and MP4 directly in your browser.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${dmMono.variable}`}
        style={{ margin: 0, background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-sans), sans-serif', WebkitFontSmoothing: 'antialiased' }}>
        {children}
      </body>
    </html>
  )
}

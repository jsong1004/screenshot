import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Capture Website Screenshot',
  description: 'Capture full-page screenshots of any website instantly. Drag and drop a URL, select device type (mobile, tablet, desktop), choose format (JPG, PNG, PDF), set full-page or viewport, add a delay, and preview before download. Modern UI with progress bar and instant feedback.',
  generator: 'Screenshots.ai-biz.app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

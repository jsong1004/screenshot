import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Capture Website Screenshot',
  description: 'Capture full-page screenshots of any website instantly. Simply enter a URL and get a high-quality JPG download with the website title automatically included in the filename.',
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

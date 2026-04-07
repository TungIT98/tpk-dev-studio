import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TKP Dev Studio - Game Development Studio',
  description: 'We build immersive Tycoon, Racing, and Obby games for Roblox and beyond.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-sm">
          <nav className="container mx-auto flex h-16 items-center justify-between px-4">
            <a href="/" className="text-xl font-bold text-primary-600">
              TKP Dev Studio
            </a>
            <ul className="flex gap-6 text-sm font-medium">
              <li><a href="/#games" className="hover:text-primary-600 transition-colors">Portfolio</a></li>
              <li><a href="/#about" className="hover:text-primary-600 transition-colors">About</a></li>
              <li><a href="/contact" className="hover:text-primary-600 transition-colors">Contact</a></li>
            </ul>
          </nav>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t bg-white py-12">
          <div className="container mx-auto px-4 text-center text-sm text-slate-500">
            <p>&copy; 2026 TKP Dev Studio. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  )
}

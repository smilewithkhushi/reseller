// app/layout.tsx
'use client'

import './globals.css'
import { Inter } from 'next/font/google'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { wagmiConfig } from '@/config/wagmi'
import { Toaster } from '@/components/ui/sonner'

import '@rainbow-me/rainbowkit/styles.css'
import { ConnectButton } from '@/components/ConnectButton'

const inter = Inter({ subsets: ['latin'] })
const queryClient = new QueryClient()

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WagmiProvider config={wagmiConfig}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider>
              <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
                <nav className="bg-white shadow-sm border-b">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                      <div className="flex items-center">
                        <h1 className="text-xl font-bold text-slate-900">
                          🔗 Product Provenance
                        </h1>
                      </div>
                      <div className="flex items-center">
                        <ConnectButton />
                      </div>
                    </div>
                  </div>
                </nav>
                <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                  {children}
                </main>
              </div>
              <Toaster />
            </RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  )
}



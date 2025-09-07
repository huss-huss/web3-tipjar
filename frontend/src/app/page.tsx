'use client'

import { TipJar } from '@/components/TipJar'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>
      
      <div className="relative z-10">
        {/* Header */}
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl mb-6 shadow-2xl">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <h1 className="text-6xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent mb-6">
              Web3 Tip Jar
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              A premium decentralized tipping platform where creators and supporters connect through 
              <span className="text-purple-400 font-semibold"> ETH</span> and 
              <span className="text-pink-400 font-semibold"> ERC-20 tokens</span>. 
              Built on the blockchain for transparency and security.
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <TipJar />
          </div>
          
          <div className="text-center mt-20">
            <div className="inline-flex items-center space-x-6 text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Sepolia Testnet</span>
              </div>
              <div className="w-px h-4 bg-gray-600"></div>
              <span>Built with Next.js & Wagmi</span>
              <div className="w-px h-4 bg-gray-600"></div>
              <span>Open Source</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
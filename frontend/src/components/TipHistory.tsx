'use client'

import { useReadContract } from 'wagmi'
import { TIPJAR_CONFIG } from '@/lib/contracts'
import { formatEther } from 'viem'

interface TipHistoryProps {
  address: `0x${string}` | undefined
}

export function TipHistory({ address }: TipHistoryProps) {
  // Read recent tip events (this would need to be implemented with event logs in a real app)
  // For now, we'll just show the user's total tips
  
  const { data: userETHTips } = useReadContract({
    ...TIPJAR_CONFIG,
    functionName: 'getTotalTipsByAddress',
    args: address ? [address] : undefined,
  })

  const { data: userTokenTips } = useReadContract({
    ...TIPJAR_CONFIG,
    functionName: 'getTokenTipsByAddress',
    args: address ? [address, '0x0000000000000000000000000000000000000000' as `0x${string}`] : undefined,
  })

  if (!address) return null

  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white">
          Your Tip History
        </h3>
      </div>
      
      <div className="space-y-4">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <span className="text-gray-300 font-medium">ETH Tips Sent</span>
            </div>
            <span className="font-mono font-bold text-white text-lg">
              {userETHTips ? formatEther(userETHTips as bigint) : '0'} ETH
            </span>
          </div>
        </div>
        
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <span className="text-gray-300 font-medium">Token Tips Sent</span>
            </div>
            <span className="font-mono font-bold text-white text-lg">
              {userTokenTips ? formatEther(userTokenTips as bigint) : '0'} TIP
            </span>
          </div>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl">
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-300 leading-relaxed">
              <span className="font-semibold text-blue-400">Pro Tip:</span> All transactions are recorded on the blockchain and can be viewed on block explorers like Etherscan for complete transparency.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { TIPJAR_CONFIG, TIPTOKEN_CONFIG } from '@/lib/contracts'
import { WalletConnectButton } from './WalletConnectButton'
import { TipForm } from './TipForm'
import { TipHistory } from './TipHistory'

export function TipJar() {
  const { address, isConnected } = useAccount()
  const [tipAmount, setTipAmount] = useState('')
  const [tokenTipAmount, setTokenTipAmount] = useState('')
  const [isTippingETH, setIsTippingETH] = useState(true)

  // Read contract data
  const { data: totalTipsReceived } = useReadContract({
    ...TIPJAR_CONFIG,
    functionName: 'totalTipsReceived',
  })

  const { data: userTips } = useReadContract({
    ...TIPJAR_CONFIG,
    functionName: 'getTotalTipsByAddress',
    args: address ? [address] : undefined,
  })

  // const { data: userTokenTips } = useReadContract({
  //   ...TIPJAR_CONFIG,
  //   functionName: 'getTokenTipsByAddress',
  //   args: address && !isTippingETH ? [address, TIPTOKEN_CONFIG.address] : undefined,
  // })

  const { data: tokenBalance } = useReadContract({
    ...TIPTOKEN_CONFIG,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })

  // Write contract functions
  const { writeContract: writeTipJar, data: tipHash, isPending: isTipPending } = useWriteContract()
  const { writeContract: writeToken, data: tokenHash, isPending: isTokenPending } = useWriteContract()

  // Wait for transaction receipts
  const { isLoading: isTipConfirming } = useWaitForTransactionReceipt({
    hash: tipHash,
  })

  const { isLoading: isTokenConfirming } = useWaitForTransactionReceipt({
    hash: tokenHash,
  })

  const handleETHTip = async () => {
    if (!tipAmount || !address) return
    
    try {
      await writeTipJar({
        ...TIPJAR_CONFIG,
        functionName: 'tip',
        value: parseEther(tipAmount),
      })
      setTipAmount('')
    } catch (error) {
      console.error('Error sending ETH tip:', error)
    }
  }

  const handleTokenTip = async () => {
    if (!tokenTipAmount || !address) return
    
    try {
      // First approve the token transfer
      await writeToken({
        ...TIPTOKEN_CONFIG,
        functionName: 'approve',
        args: [TIPJAR_CONFIG.address, parseEther(tokenTipAmount)],
      })
      
      // Then send the tip
      await writeTipJar({
        ...TIPJAR_CONFIG,
        functionName: 'tipWithToken',
        args: [TIPTOKEN_CONFIG.address, parseEther(tokenTipAmount)],
      })
      setTokenTipAmount('')
    } catch (error) {
      console.error('Error sending token tip:', error)
    }
  }

  if (!isConnected) {
    return (
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-12 text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl mb-6 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-gray-300 text-lg mb-8 max-w-md mx-auto">
            Connect your wallet to start supporting creators and sending tips securely on the blockchain
          </p>
        </div>
        <WalletConnectButton />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 text-center hover:bg-white/15 transition-all duration-300 group">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-300 mb-2">
            Total Tips Received
          </h3>
          <p className="text-3xl font-bold text-white">
            {totalTipsReceived ? formatEther(totalTipsReceived as bigint) : '0'} ETH
          </p>
        </div>
        
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 text-center hover:bg-white/15 transition-all duration-300 group">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-300 mb-2">
            Your ETH Tips
          </h3>
          <p className="text-3xl font-bold text-white">
            {userTips ? formatEther(userTips as bigint) : '0'} ETH
          </p>
        </div>
        
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 text-center hover:bg-white/15 transition-all duration-300 group">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-300 mb-2">
            Your Token Balance
          </h3>
          <p className="text-3xl font-bold text-white">
            {tokenBalance ? formatEther(tokenBalance as bigint) : '0'} TIP
          </p>
        </div>
      </div>

      {/* Tip Forms */}
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-10">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Send a Tip</h2>
          <p className="text-gray-300">Choose your preferred payment method</p>
        </div>
        
        <div className="flex space-x-3 mb-8 justify-center">
          <button
            onClick={() => setIsTippingETH(true)}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
              isTippingETH
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg transform scale-105'
                : 'bg-white/10 text-gray-300 hover:bg-white/20 border border-white/20'
            }`}
          >
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              <span>ETH</span>
            </div>
          </button>
          <button
            onClick={() => setIsTippingETH(false)}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
              !isTippingETH
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg transform scale-105'
                : 'bg-white/10 text-gray-300 hover:bg-white/20 border border-white/20'
            }`}
          >
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <span>TIP Token</span>
            </div>
          </button>
        </div>

        {isTippingETH ? (
          <TipForm
            amount={tipAmount}
            setAmount={setTipAmount}
            onSubmit={handleETHTip}
            isPending={isTipPending || isTipConfirming}
            currency="ETH"
            placeholder="0.01"
          />
        ) : (
          <TipForm
            amount={tokenTipAmount}
            setAmount={setTokenTipAmount}
            onSubmit={handleTokenTip}
            isPending={isTokenPending || isTokenConfirming}
            currency="TIP"
            placeholder="10"
          />
        )}
      </div>

      {/* Tip History */}
      <TipHistory address={address} />
    </div>
  )
}

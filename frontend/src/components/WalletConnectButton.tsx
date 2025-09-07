'use client'

import { useState } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'

export function WalletConnectButton() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending, error } = useConnect()
  const { disconnect } = useDisconnect()
  const [connectingTo, setConnectingTo] = useState<string | null>(null)

  // Debug: Log available connectors and wallet detection
  console.log('Available connectors:', connectors.map(c => ({ name: c.name, target: c.target })))
  console.log('Window.ethereum:', typeof window !== 'undefined' ? {
    exists: !!window.ethereum,
    isMetaMask: window.ethereum?.isMetaMask,
    isCoinbaseWallet: window.ethereum?.isCoinbaseWallet,
    isRainbow: window.ethereum?.isRainbow,
    isTrust: window.ethereum?.isTrust
  } : 'Server side')

  const handleConnect = async (connector: any) => {
    setConnectingTo(connector.uid)
    try {
      // Check if wallet is available for injected connectors
      if (connector.name === 'Injected' && typeof window !== 'undefined' && !window.ethereum) {
        throw new Error('No wallet detected. Please install a Web3 wallet like MetaMask, Coinbase Wallet, or Rainbow.')
      }
      
      // Check for specific wallet types based on target
      if (connector.target === 'coinbaseWallet' && typeof window !== 'undefined' && !window.ethereum?.isCoinbaseWallet) {
        throw new Error('Coinbase Wallet not detected. Please install Coinbase Wallet extension.')
      }
      if (connector.target === 'rainbow' && typeof window !== 'undefined' && !window.ethereum?.isRainbow) {
        throw new Error('Rainbow Wallet not detected. Please install Rainbow Wallet extension.')
      }
      if (connector.target === 'trust' && typeof window !== 'undefined' && !window.ethereum?.isTrust) {
        throw new Error('Trust Wallet not detected. Please install Trust Wallet extension.')
      }
      
      await connect({ connector })
      // Only remove loading after successful connection
      setConnectingTo(null)
    } catch (err: any) {
      console.error('Connection failed:', err)
      // Remove loading after failed connection
      setConnectingTo(null)
      // Error will be shown by the error state from useConnect
    }
  }

  const getWalletIcon = (connector: any) => {
    if (connector.name === 'MetaMask') {
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      )
    }
    if (connector.target === 'coinbaseWallet') {
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      )
    }
    return (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
    )
  }

  const getWalletName = (connector: any) => {
    if (connector.name === 'MetaMask') return 'MetaMask'
    if (connector.target === 'coinbaseWallet') return 'Coinbase Wallet'
    if (connector.target === 'rainbow') return 'Rainbow'
    if (connector.target === 'trust') return 'Trust Wallet'
    if (connector.name === 'Injected') return 'Injected'
    return connector.name
  }

  if (isConnected) {
    return (
      <div className="text-center">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-400 font-semibold">Connected</span>
          </div>
          <p className="text-gray-300 font-mono text-sm break-all">
            {address}
          </p>
        </div>
        <button
          onClick={() => disconnect()}
          className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:from-red-600 hover:to-pink-600 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          Disconnect Wallet
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
          <p className="text-red-400 text-sm">
            {error.message || 'Connection failed. Please try again.'}
          </p>
        </div>
      )}
      
      {connectors
        .filter((connector) => {
          // Show MetaMask always
          if (connector.name === 'MetaMask') return true
          
          // For injected wallets, check if they're available based on target
          if (connector.target === 'coinbaseWallet') {
            return typeof window !== 'undefined' && (window.ethereum?.isCoinbaseWallet || false)
          }
          
          if (connector.target === 'rainbow') {
            return typeof window !== 'undefined' && (window.ethereum?.isRainbow || false)
          }
          
          if (connector.target === 'trust') {
            return typeof window !== 'undefined' && (window.ethereum?.isTrust || false)
          }
          
          if (connector.name === 'Injected' && !connector.target) {
            // Generic injected wallet - show if any wallet is available
            return typeof window !== 'undefined' && !!window.ethereum
          }
          
          return true
        })
        .map((connector) => {
        const isConnecting = connectingTo === connector.uid
        const isDisabled = connectingTo !== null
        
        return (
          <button
            key={connector.uid}
            onClick={() => handleConnect(connector)}
            disabled={isDisabled}
            className={`w-full px-6 py-4 rounded-xl font-semibold shadow-lg transition-all duration-300 flex items-center justify-center space-x-3 ${
              isConnecting
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white transform scale-105 shadow-xl'
                : isDisabled
                ? 'bg-gray-500/50 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 hover:shadow-xl transform hover:scale-105'
            }`}
          >
            {isConnecting ? (
              <>
                <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                </div>
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                  {getWalletIcon(connector)}
                </div>
                <span>Connect {getWalletName(connector)}</span>
              </>
            )}
          </button>
        )
      })}
    </div>
  )
}

'use client'

import { useState } from 'react'
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useWriteContract,
} from 'wagmi'
import { formatEther, parseEther, type Hash } from 'viem'
import {
  TIPJAR_CONFIG,
  TIPTOKEN_CONFIG,
  isContractConfigValid,
  missingContractConfig,
} from '@/lib/contracts'
import { WalletConnectButton } from './WalletConnectButton'
import { TipForm } from './TipForm'
import { TipHistory } from './TipHistory'

type TxStatus = 'idle' | 'approving' | 'tipping'

/** Parse a user-entered decimal amount; returns undefined if invalid or <= 0. */
function parseAmount(value: string): bigint | undefined {
  try {
    const parsed = parseEther(value.trim())
    return parsed > 0n ? parsed : undefined
  } catch {
    return undefined
  }
}

function errorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'shortMessage' in error) {
    return String((error as { shortMessage: unknown }).shortMessage)
  }
  return error instanceof Error ? error.message : 'Transaction failed'
}

export function TipJar() {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient({ chainId: TIPJAR_CONFIG.chainId })
  const [tipAmount, setTipAmount] = useState('')
  const [tokenTipAmount, setTokenTipAmount] = useState('')
  const [isTippingETH, setIsTippingETH] = useState(true)
  const [status, setStatus] = useState<TxStatus>('idle')
  const [txError, setTxError] = useState<string | null>(null)
  const [lastTxHash, setLastTxHash] = useState<Hash | null>(null)

  const enabled = isContractConfigValid && !!address

  // Read contract data
  const { data: totalTipsReceived, refetch: refetchTotal } = useReadContract({
    ...TIPJAR_CONFIG,
    functionName: 'totalTipsReceived',
    query: { enabled: isContractConfigValid },
  })

  const { data: userTips, refetch: refetchUserTips } = useReadContract({
    ...TIPJAR_CONFIG,
    functionName: 'getTotalTipsByAddress',
    args: address ? [address] : undefined,
    query: { enabled },
  })

  const { data: tokenBalance, refetch: refetchTokenBalance } = useReadContract({
    ...TIPTOKEN_CONFIG,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled },
  })

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    ...TIPTOKEN_CONFIG,
    functionName: 'allowance',
    args: address ? [address, TIPJAR_CONFIG.address] : undefined,
    query: { enabled },
  })

  const { writeContractAsync } = useWriteContract()

  async function waitFor(hash: Hash) {
    setLastTxHash(hash)
    if (!publicClient) throw new Error('No RPC client for the configured chain')
    const receipt = await publicClient.waitForTransactionReceipt({ hash })
    if (receipt.status !== 'success') throw new Error('Transaction reverted')
  }

  async function refreshAll() {
    await Promise.all([refetchTotal(), refetchUserTips(), refetchTokenBalance(), refetchAllowance()])
  }

  const handleETHTip = async () => {
    const value = parseAmount(tipAmount)
    if (!value || !address) return
    setTxError(null)
    setStatus('tipping')
    try {
      const hash = await writeContractAsync({
        ...TIPJAR_CONFIG,
        functionName: 'tip',
        value,
      })
      await waitFor(hash)
      setTipAmount('')
      await refreshAll()
    } catch (error) {
      setTxError(errorMessage(error))
    } finally {
      setStatus('idle')
    }
  }

  const handleTokenTip = async () => {
    const amount = parseAmount(tokenTipAmount)
    if (!amount || !address) return
    setTxError(null)
    try {
      // Approve only the exact amount, and only when the current allowance is
      // too low. The tip must wait for the approval to be mined, otherwise
      // transferFrom reverts with an insufficient allowance.
      if ((allowance ?? 0n) < amount) {
        setStatus('approving')
        const approveHash = await writeContractAsync({
          ...TIPTOKEN_CONFIG,
          functionName: 'approve',
          args: [TIPJAR_CONFIG.address, amount],
        })
        await waitFor(approveHash)
      }

      setStatus('tipping')
      const tipHash = await writeContractAsync({
        ...TIPJAR_CONFIG,
        functionName: 'tipWithToken',
        args: [TIPTOKEN_CONFIG.address, amount],
      })
      await waitFor(tipHash)
      setTokenTipAmount('')
      await refreshAll()
    } catch (error) {
      setTxError(errorMessage(error))
    } finally {
      setStatus('idle')
    }
  }

  if (!isContractConfigValid) {
    return (
      <div className="bg-white/10 backdrop-blur-xl border border-yellow-500/30 rounded-3xl shadow-2xl p-12 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Contract addresses not configured</h2>
        <p className="text-gray-300 mb-4">
          Copy <code className="font-mono">frontend/.env.example</code> to{' '}
          <code className="font-mono">frontend/.env.local</code> and set:
        </p>
        <ul className="font-mono text-sm text-yellow-300 space-y-1">
          {missingContractConfig.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      </div>
    )
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
            {totalTipsReceived !== undefined ? formatEther(totalTipsReceived) : '0'} ETH
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
            {userTips !== undefined ? formatEther(userTips) : '0'} ETH
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
            {tokenBalance !== undefined ? formatEther(tokenBalance) : '0'} TIP
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
            isPending={status !== 'idle'}
            currency="ETH"
            placeholder="0.01"
          />
        ) : (
          <TipForm
            amount={tokenTipAmount}
            setAmount={setTokenTipAmount}
            onSubmit={handleTokenTip}
            isPending={status !== 'idle'}
            currency="TIP"
            placeholder="10"
          />
        )}

        {status === 'approving' && (
          <p className="mt-6 text-center text-sm text-gray-300">
            Step 1 of 2: approving TIP for the jar...
          </p>
        )}
        {status === 'tipping' && (
          <p className="mt-6 text-center text-sm text-gray-300">Sending tip and waiting for confirmation...</p>
        )}
        {txError && (
          <div role="alert" className="mt-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
            <p className="text-red-400 text-sm break-words">{txError}</p>
          </div>
        )}
        {lastTxHash && status === 'idle' && !txError && (
          <p className="mt-6 text-center text-xs text-gray-400 font-mono break-all">
            Last transaction: {lastTxHash}
          </p>
        )}
      </div>

      {/* Tip History */}
      <TipHistory address={address} />
    </div>
  )
}

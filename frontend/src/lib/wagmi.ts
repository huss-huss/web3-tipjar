import { createConfig, http } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { QueryClient } from '@tanstack/react-query'
import type { Chain } from 'viem'
import { activeChain, rpcUrl } from '@/lib/chains'

// Only the configured chain is enabled, so the app never offers mainnet.
// The injected connector covers MetaMask and other browser wallets (EIP-6963
// discovery is on by default in wagmi).
export const wagmiConfig = createConfig({
  chains: [activeChain] as [Chain],
  connectors: [injected()],
  transports: {
    [activeChain.id]: http(rpcUrl),
  },
  ssr: true,
})

export const queryClient = new QueryClient()

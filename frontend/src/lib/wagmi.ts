import { createConfig, http } from 'wagmi'
import { sepolia, mainnet } from 'wagmi/chains'
import { QueryClient } from '@tanstack/react-query'
import { injected, metaMask } from 'wagmi/connectors'

// Create wagmiConfig - Using MetaMask and injected wallets
export const wagmiConfig = createConfig({
  chains: [sepolia, mainnet],
  connectors: [
    metaMask(),
    injected({
      target: 'coinbaseWallet',
    }),
    injected({
      target: 'rainbow',
    }),
    injected({
      target: 'trust',
    }),
    injected(), // Generic injected wallet
  ],
  transports: {
    [sepolia.id]: http(),
    [mainnet.id]: http(),
  },
})

export const queryClient = new QueryClient()

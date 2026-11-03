import { hardhat, sepolia } from 'wagmi/chains'

const supportedChains = { [hardhat.id]: hardhat, [sepolia.id]: sepolia } as const

type SupportedChainId = keyof typeof supportedChains

const requestedChainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? hardhat.id)

/** Chain the dApp talks to. Defaults to the local Hardhat node (31337). */
export const activeChain =
  supportedChains[requestedChainId as SupportedChainId] ?? hardhat

/** Optional RPC override; falls back to the chain's default public RPC. */
export const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || undefined

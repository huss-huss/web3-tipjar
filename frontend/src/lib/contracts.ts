import { isAddress, zeroAddress, type Address } from 'viem'
import { tipJarAbi, tipTokenAbi } from '@/contracts/abis'
import { activeChain } from '@/lib/chains'

// NEXT_PUBLIC_* values are inlined at build time, so they must be read with
// literal property access (no dynamic process.env[key] lookups).
function parseAddress(value: string | undefined): Address | undefined {
  return value && isAddress(value) && value !== zeroAddress ? value : undefined
}

const tipJarAddress = parseAddress(process.env.NEXT_PUBLIC_TIPJAR_ADDRESS)
const tipTokenAddress = parseAddress(process.env.NEXT_PUBLIC_TIPTOKEN_ADDRESS)

/** Names of required env vars that are missing or not valid addresses. */
export const missingContractConfig: string[] = [
  ...(tipJarAddress ? [] : ['NEXT_PUBLIC_TIPJAR_ADDRESS']),
  ...(tipTokenAddress ? [] : ['NEXT_PUBLIC_TIPTOKEN_ADDRESS']),
]

export const isContractConfigValid = missingContractConfig.length === 0

// When config is missing the UI shows a setup message and never sends
// transactions, so the zero-address fallback is only a typed placeholder.
const placeholder: Address = zeroAddress

export const TIPJAR_CONFIG = {
  address: tipJarAddress ?? placeholder,
  abi: tipJarAbi,
  chainId: activeChain.id,
} as const

export const TIPTOKEN_CONFIG = {
  address: tipTokenAddress ?? placeholder,
  abi: tipTokenAbi,
  chainId: activeChain.id,
} as const

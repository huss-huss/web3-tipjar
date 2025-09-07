import { sepolia } from 'wagmi/chains'
import TipJarABI from '@/contracts/TipJar.json'
import TipTokenABI from '@/contracts/TipToken.json'
import contractAddresses from '../../contract-addresses.json'

export const TIPJAR_ADDRESS = contractAddresses.TipJar as `0x${string}`
export const TIPTOKEN_ADDRESS = contractAddresses.TipToken as `0x${string}`

export const TIPJAR_CONFIG = {
  address: TIPJAR_ADDRESS,
  abi: TipJarABI.abi,
  chainId: sepolia.id,
}

export const TIPTOKEN_CONFIG = {
  address: TIPTOKEN_ADDRESS,
  abi: TipTokenABI.abi,
  chainId: sepolia.id,
}

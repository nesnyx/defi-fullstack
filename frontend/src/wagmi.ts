import { createConfig, http } from 'wagmi'
import { mainnet, sepolia,hardhat } from 'wagmi/chains'
import { createClient } from 'viem'

export const config = createConfig({
  chains: [mainnet, sepolia,hardhat],
  client({ chain }) {
    return createClient({ chain, transport: http() })
  },
})
declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}

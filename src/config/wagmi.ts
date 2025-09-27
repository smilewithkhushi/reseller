// config/wagmi.ts
'use client'

import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { http } from 'viem'
import { defineChain } from 'viem'

// Define Flow EVM Mainnet
const flowMainnet = defineChain({
  id: 747,
  name: 'Flow EVM',
  network: 'flow-mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Flow',
    symbol: 'FLOW',
  },
  rpcUrls: {
    default: {
      http: ['https://mainnet.evm.nodes.onflow.org'],
    },
    public: {
      http: ['https://mainnet.evm.nodes.onflow.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Flow EVM Explorer',
      url: 'https://evm.flowscan.io',
    },
  },
})

// Define Flow EVM Testnet
const flowTestnet = defineChain({
  id: 545,
  name: 'Flow EVM Testnet',
  network: 'flow-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Flow',
    symbol: 'FLOW',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet.evm.nodes.onflow.org'],
    },
    public: {
      http: ['https://testnet.evm.nodes.onflow.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Flow EVM Testnet Explorer',
      url: 'https://evm-testnet.flowscan.io',
    },
  },
})

// Define chains
const chains = [flowMainnet, flowTestnet] as const

// Create wagmi config using RainbowKit's default config
export const wagmiConfig = getDefaultConfig({
  appName: 'Product Provenance DApp',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '',
  chains,
  transports: {
    [flowMainnet.id]: http('https://mainnet.evm.nodes.onflow.org'),
    [flowTestnet.id]: http('https://testnet.evm.nodes.onflow.org'),
  },
})

// Export chains for use in RainbowKit
export { chains }

// Chain-specific configurations
export const chainConfig = {
  [flowMainnet.id]: {
    name: 'Flow EVM Mainnet',
    blockExplorer: 'https://evm.flowscan.io',
    rpcUrl: 'https://mainnet.evm.nodes.onflow.org',
    gasPrice: 'standard',
    confirmations: 3
  },
  [flowTestnet.id]: {
    name: 'Flow EVM Testnet',
    blockExplorer: 'https://evm-testnet.flowscan.io',
    rpcUrl: 'https://testnet.evm.nodes.onflow.org',
    gasPrice: 'fast',
    confirmations: 2
  }
} as const

// Helper function to get current chain config
export const getCurrentChainConfig = (chainId: number) => {
  return chainConfig[chainId as keyof typeof chainConfig] || chainConfig[flowTestnet.id]
}

// Network switching helper
export const switchToChain = async (chainId: number) => {
  if (typeof window !== 'undefined' && window.ethereum) {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      })
    } catch (error: any) {
      // If chain is not added, add it
      if (error.code === 4902) {
        const config = getCurrentChainConfig(chainId)
        const chain = chains.find(c => c.id === chainId)
        
        if (chain && config) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: `0x${chainId.toString(16)}`,
                chainName: config.name,
                rpcUrls: [config.rpcUrl],
                blockExplorerUrls: config.blockExplorer ? [config.blockExplorer] : [],
                nativeCurrency: {
                  name: chain.nativeCurrency.name,
                  symbol: chain.nativeCurrency.symbol,
                  decimals: chain.nativeCurrency.decimals,
                }
              }]
            })
          } catch (addError) {
            console.error('Failed to add chain:', addError)
          }
        }
      } else {
        console.error('Failed to switch chain:', error)
      }
    }
  }
}

// Recommended chains for the app (in order of preference)
export const recommendedChains = [
  flowTestnet.id,  // Primary testnet
  flowMainnet.id   // Primary mainnet
] as const

// Check if chain is supported
export const isSupportedChain = (chainId?: number): boolean => {
  if (!chainId) return false
  return chains.some(chain => chain.id === chainId)
}

// Get chain name by ID
export const getChainName = (chainId: number): string => {
  const chain = chains.find(c => c.id === chainId)
  return chain?.name || 'Unknown Chain'
}

// Gas price configurations
export const gasConfigs = {
  slow: {
    maxFeePerGas: '1000000000', // 1 gwei
    maxPriorityFeePerGas: '100000000', // 0.1 gwei
  },
  standard: {
    maxFeePerGas: '2000000000', // 2 gwei
    maxPriorityFeePerGas: '200000000', // 0.2 gwei
  },
  fast: {
    maxFeePerGas: '5000000000', // 5 gwei
    maxPriorityFeePerGas: '500000000', // 0.5 gwei
  },
  urgent: {
    maxFeePerGas: '10000000000', // 10 gwei
    maxPriorityFeePerGas: '1000000000', // 1 gwei
  }
} as const

// Transaction defaults by chain
export const getTransactionDefaults = (chainId: number) => {
  const config = getCurrentChainConfig(chainId)
  
  return {
    gasLimit: 500000, // Default gas limit
    ...gasConfigs[config.gasPrice as keyof typeof gasConfigs],
    confirmations: config.confirmations
  }
}

// RainbowKit theme customization
export const rainbowKitTheme = {
  lightMode: {
    accentColor: '#00EF8B', // Flow green
    accentColorForeground: 'white',
    borderRadius: 'medium',
    fontStack: 'system',
  },
  darkMode: {
    accentColor: '#00EF8B', // Flow green
    accentColorForeground: 'black',
    borderRadius: 'medium',
    fontStack: 'system',
  }
} as const

// Wallet connection options
export const walletOptions = {
  appName: 'Product Provenance DApp',
  appDescription: 'Flow EVM-based product authenticity and ownership tracking',
  appUrl: 'https://your-domain.com',
  appIcon: '/images/logo.svg',
} as const

// Error messages for common issues
export const errorMessages = {
  CHAIN_NOT_SUPPORTED: 'This chain is not supported. Please switch to Flow EVM Mainnet or Testnet.',
  WALLET_NOT_CONNECTED: 'Please connect your wallet to continue.',
  TRANSACTION_REJECTED: 'Transaction was rejected by the user.',
  INSUFFICIENT_FUNDS: 'Insufficient FLOW tokens for this transaction.',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  CONTRACT_ERROR: 'Smart contract error. Please try again later.',
} as const

// Helper to format addresses
export const formatAddress = (address: string, chars = 4): string => {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

// Helper to format transaction hash
export const formatTxHash = (hash: string, chars = 6): string => {
  return `${hash.slice(0, chars + 2)}...${hash.slice(-chars)}`
}

// Helper to get block explorer URL
export const getBlockExplorerUrl = (chainId: number, hash: string, type: 'tx' | 'address' = 'tx'): string => {
  const config = getCurrentChainConfig(chainId)
  if (!config.blockExplorer) return ''
  
  return `${config.blockExplorer}/${type}/${hash}`
}

// Flow-specific utilities
export const flowUtils = {
  // Check if address is Flow EVM format
  isFlowEVMAddress: (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address)
  },
  
  // Convert Flow account to EVM address (if needed)
  flowToEVMAddress: (flowAddress: string): string => {
    // This would need specific Flow conversion logic
    // For now, return as-is if it's already EVM format
    return flowUtils.isFlowEVMAddress(flowAddress) ? flowAddress : flowAddress
  },
  
  // Get Flow network info
  getNetworkInfo: (chainId: number) => {
    const isMainnet = chainId === flowMainnet.id
    return {
      isMainnet,
      isTestnet: !isMainnet,
      faucetUrl: isMainnet ? null : 'https://testnet-faucet.onflow.org/',
      docsUrl: 'https://developers.flow.com/evm/about',
    }
  }
}
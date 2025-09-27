// scripts/sync-blockchain.ts - CLI script for syncing
import { BlockchainSynchronizer } from '../lib/db-sync'

async function main() {
  const args = process.argv.slice(2)
  const chainId = parseInt(args[0]) || 31337
  const fromBlock = args[1] ? BigInt(args[1]) : undefined

  const config = {
    chainId,
    contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '',
    rpcUrl: process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL || 'http://localhost:8545',
    fromBlock
  }

  const synchronizer = new BlockchainSynchronizer(config)
  await synchronizer.syncEvents()
}

if (require.main === module) {
  main().catch(console.error)
}
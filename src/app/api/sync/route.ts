
import { PrismaClient } from '@/generated/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http, parseAbiItem } from 'viem'
import { polygon } from 'viem/chains'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { chainId, contractAddress, fromBlock } = await request.json()

    const client = createPublicClient({
      chain: polygon, // Configure based on chainId
      transport: http()
    })

    // Get sync status
    let syncStatus = await prisma.syncStatus.findUnique({
      where: { chainId }
    })

    if (!syncStatus) {
      syncStatus = await prisma.syncStatus.create({
        data: {
          chainId,
          contractAddress,
          lastSyncBlock: BigInt(fromBlock || 0)
        }
      })
    }

    const startBlock = fromBlock ? BigInt(fromBlock) : syncStatus.lastSyncBlock

    // Sync events (example for ProductRegistered)
    const logs = await client.getLogs({
      address: contractAddress as `0x${string}`,
      event: parseAbiItem('event ProductRegistered(uint256 indexed productId, address indexed owner, string metadataHash)'),
      fromBlock: startBlock,
      toBlock: 'latest'
    })

    let syncedCount = 0

    for (const log of logs) {
      try {
        // Process each event and update database
        // This is a simplified example - you'd handle all event types
        const { productId, owner, metadataHash } = log.args as any

        // Check if product already exists
        const existingProduct = await prisma.product.findUnique({
          where: { productId: Number(productId) }
        })

        if (!existingProduct) {
          // Create user if not exists
          let user = await prisma.user.findUnique({
            where: { address: owner.toLowerCase() }
          })

          if (!user) {
            user = await prisma.user.create({
              data: { address: owner.toLowerCase() }
            })
          }

          // Create product
          await prisma.product.create({
            data: {
              productId: Number(productId),
              name: `Product ${productId}`, // Would fetch from IPFS
              metadataHash,
              contractAddress,
              chainId,
              transactionHash: log.transactionHash!,
              blockNumber: log.blockNumber!,
              registrationTimestamp: new Date(),
              initialOwnerId: user.id,
              currentOwnerId: user.id
            }
          })

          syncedCount++
        }
      } catch (error) {
        console.error('Error processing log:', error)
      }
    }

    // Update sync status
    const latestBlock = logs.length > 0 
      ? logs[logs.length - 1].blockNumber! 
      : syncStatus.lastSyncBlock

    await prisma.syncStatus.update({
      where: { chainId },
      data: {
        lastSyncBlock: latestBlock,
        lastSyncAt: new Date()
      }
    })

    return NextResponse.json({ 
      syncedCount, 
      lastBlock: latestBlock.toString(),
      message: `Synced ${syncedCount} new events`
    })
  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}
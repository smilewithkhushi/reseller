// lib/db-sync.ts - Blockchain synchronization utility

import { createPublicClient, http, parseAbiItem, getContract } from 'viem'
import { polygon, polygonMumbai } from 'viem/chains'
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '@/config/contract'
import { prisma } from './prisma'


interface SyncConfig {
  chainId: number
  contractAddress: string
  rpcUrl: string
  fromBlock?: bigint
}

export class BlockchainSynchronizer {
  private client: any
  private config: SyncConfig

  constructor(config: SyncConfig) {
    this.config = config
    this.client = createPublicClient({
      chain: config.chainId === 137 ? polygon : polygonMumbai,
      transport: http(config.rpcUrl)
    })
  }

  async syncEvents(eventTypes: string[] = ['all']) {
    console.log(`🔄 Starting sync for chain ${this.config.chainId}...`)

    try {
      // Get sync status
      let syncStatus = await prisma.syncStatus.findUnique({
        where: { chainId: this.config.chainId }
      })

      if (!syncStatus) {
        syncStatus = await prisma.syncStatus.create({
          data: {
            chainId: this.config.chainId,
            contractAddress: this.config.contractAddress,
            lastSyncBlock: this.config.fromBlock || BigInt(0)
          }
        })
      }

      const fromBlock = this.config.fromBlock || syncStatus.lastSyncBlock
      const toBlock = await this.client.getBlockNumber()

      console.log(`📦 Syncing from block ${fromBlock} to ${toBlock}`)

      // Sync different event types
      if (eventTypes.includes('all') || eventTypes.includes('products')) {
        await this.syncProductEvents(fromBlock, toBlock)
      }

      if (eventTypes.includes('all') || eventTypes.includes('invoices')) {
        await this.syncInvoiceEvents(fromBlock, toBlock)
      }

      if (eventTypes.includes('all') || eventTypes.includes('transfers')) {
        await this.syncTransferEvents(fromBlock, toBlock)
      }

      // Update sync status
      await prisma.syncStatus.update({
        where: { chainId: this.config.chainId },
        data: {
          lastSyncBlock: toBlock,
          lastSyncAt: new Date()
        }
      })

      console.log(`✅ Sync completed up to block ${toBlock}`)

    } catch (error) {
      console.error('❌ Sync failed:', error)
      
      // Log sync error
      await prisma.syncStatus.update({
        where: { chainId: this.config.chainId },
        data: {
          syncErrors: { error: error instanceof Error ? error.message : String(error), timestamp: new Date() }
        }
      })
      
      throw error
    }
  }

  private async syncProductEvents(fromBlock: bigint, toBlock: bigint) {
    const logs = await this.client.getLogs({
      address: this.config.contractAddress as `0x${string}`,
      event: parseAbiItem('event ProductRegistered(uint256 indexed productId, address indexed owner, string metadataHash)'),
      fromBlock,
      toBlock
    })

    for (const log of logs) {
      await this.processProductRegistered(log)
    }

    console.log(`📦 Processed ${logs.length} product registration events`)
  }

  private async syncInvoiceEvents(fromBlock: bigint, toBlock: bigint) {
    const logs = await this.client.getLogs({
      address: this.config.contractAddress as `0x${string}`,
      event: parseAbiItem('event InvoiceCreated(uint256 indexed invoiceId, uint256 indexed productId, address indexed seller, address buyer)'),
      fromBlock,
      toBlock
    })

    for (const log of logs) {
      await this.processInvoiceCreated(log)
    }

    console.log(`🧾 Processed ${logs.length} invoice creation events`)
  }

  private async syncTransferEvents(fromBlock: bigint, toBlock: bigint) {
    const [initiatedLogs, signedLogs, completedLogs] = await Promise.all([
      this.client.getLogs({
        address: this.config.contractAddress as `0x${string}`,
        event: parseAbiItem('event TransferInitiated(uint256 indexed certificateId, uint256 indexed productId, address indexed seller, address buyer)'),
        fromBlock,
        toBlock
      }),
      this.client.getLogs({
        address: this.config.contractAddress as `0x${string}`,
        event: parseAbiItem('event TransferSigned(uint256 indexed certificateId, address indexed signer, bool isComplete)'),
        fromBlock,
        toBlock
      }),
      this.client.getLogs({
        address: this.config.contractAddress as `0x${string}`,
        event: parseAbiItem('event OwnershipTransferred(uint256 indexed productId, address indexed from, address indexed to)'),
        fromBlock,
        toBlock
      })
    ])

    for (const log of initiatedLogs) {
      await this.processTransferInitiated(log)
    }

    for (const log of signedLogs) {
      await this.processTransferSigned(log)
    }

    for (const log of completedLogs) {
      await this.processOwnershipTransferred(log)
    }

    console.log(`🔄 Processed ${initiatedLogs.length + signedLogs.length + completedLogs.length} transfer events`)
  }

  private async processProductRegistered(log: any) {
    const { productId, owner, metadataHash } = log.args
    const block = await this.client.getBlock({ blockNumber: log.blockNumber })

    try {
      // Check if product already exists
      const existingProduct = await prisma.product.findUnique({
        where: { productId: Number(productId) }
      })

      if (existingProduct) return

      // Find or create user
      let user = await this.findOrCreateUser(owner)

      // Fetch metadata from IPFS (mock implementation)
      const metadata = await this.fetchMetadata(metadataHash)

      // Create product
      await prisma.product.create({
        data: {
          productId: Number(productId),
          name: metadata.name || `Product ${productId}`,
          description: metadata.description,
          category: metadata.category,
          manufacturer: metadata.manufacturer,
          model: metadata.model,
          serialNumber: metadata.serialNumber,
          sku: metadata.sku,
          metadataHash,
          metadataUri: `https://ipfs.io/ipfs/${metadataHash}`,
          images: metadata.images || [],
          contractAddress: this.config.contractAddress,
          chainId: this.config.chainId,
          transactionHash: log.transactionHash,
          blockNumber: log.blockNumber,
          registrationTimestamp: new Date(Number(block.timestamp) * 1000),
          initialOwnerId: user.id,
          currentOwnerId: user.id
        }
      })

      // Create audit log
      await prisma.auditLog.create({
        data: {
          action: 'PRODUCT_REGISTERED',
          description: `Product ${metadata.name || productId} registered`,
          userId: user.id,
          productId: Number(productId),
          transactionHash: log.transactionHash,
          blockNumber: log.blockNumber,
          chainId: this.config.chainId
        }
      })

    } catch (error) {
      console.error(`Failed to process ProductRegistered event:`, error)
    }
  }

  private async processInvoiceCreated(log: any) {
    try {
      const { invoiceId, productId, seller, buyer } = log.args
      const block = await this.client.getBlock({ blockNumber: log.blockNumber })

      // Get invoice details from contract
      const contract = getContract({
        address: this.config.contractAddress as `0x${string}`,
        abi: CONTRACT_ABI,
        client: this.client
      })

      const invoiceData = await contract.read.getInvoice([invoiceId])

      // Find or create users
      const [sellerUser, buyerUser] = await Promise.all([
        this.findOrCreateUser(seller),
        this.findOrCreateUser(buyer)
      ])

      // Create invoice
      await prisma.invoice.create({
        data: {
          invoiceId: Number(invoiceId),
          productId: Number(productId),
          sellerId: sellerUser.id,
          buyerId: buyerUser.id,
          invoiceHash: invoiceData.invoiceHash,
          lighthouseUri: invoiceData.lighthouseURI,
          contractAddress: this.config.contractAddress,
          chainId: this.config.chainId,
          transactionHash: log.transactionHash,
          blockNumber: log.blockNumber,
          timestamp: new Date(Number(block.timestamp) * 1000)
        }
      })

      // Create audit log
      await prisma.auditLog.create({
        data: {
          action: 'INVOICE_CREATED',
          description: `Invoice ${invoiceId} created`,
          userId: sellerUser.id,
          productId: Number(productId),
          invoiceId: Number(invoiceId),
          transactionHash: log.transactionHash,
          blockNumber: log.blockNumber,
          chainId: this.config.chainId
        }
      })

    } catch (error) {
      console.error(`Failed to process InvoiceCreated event:`, error)
    }
  }

  private async processTransferInitiated(log: any) {
    try {
      const { certificateId, productId, seller, buyer } = log.args
      const block = await this.client.getBlock({ blockNumber: log.blockNumber })

      // Get transfer details from contract
      const contract = getContract({
        address: this.config.contractAddress as `0x${string}`,
        abi: CONTRACT_ABI,
        client: this.client
      })

      const transferData = await contract.read.getTransferCertificate([certificateId])

      // Find or create users
      const [sellerUser, buyerUser] = await Promise.all([
        this.findOrCreateUser(seller),
        this.findOrCreateUser(buyer)
      ])

      // Create transfer certificate
      await prisma.transferCertificate.create({
        data: {
          certificateId: Number(certificateId),
          productId: Number(productId),
          invoiceId: Number(transferData.invoiceId),
          sellerId: sellerUser.id,
          buyerId: buyerUser.id,
          certificateHash: transferData.certificateHash,
          lighthouseUri: transferData.lighthouseURI,
          contractAddress: this.config.contractAddress,
          chainId: this.config.chainId,
          transactionHash: log.transactionHash,
          blockNumber: log.blockNumber,
          timestamp: new Date(Number(block.timestamp) * 1000),
          sellerSigned: transferData.sellerSigned,
          buyerSigned: transferData.buyerSigned,
          isComplete: transferData.isComplete
        }
      })

    } catch (error) {
      console.error(`Failed to process TransferInitiated event:`, error)
    }
  }

  private async processTransferSigned(log: any) {
    try {
      const { certificateId, signer, isComplete } = log.args

      // Update transfer certificate
      const transfer = await prisma.transferCertificate.findUnique({
        where: { certificateId: Number(certificateId) },
        include: { seller: true, buyer: true }
      })

      if (!transfer) return

      const updateData: any = {}
      
      if (transfer.seller.address.toLowerCase() === signer.toLowerCase()) {
        updateData.sellerSigned = true
        updateData.sellerSignedAt = new Date()
      } else if (transfer.buyer.address.toLowerCase() === signer.toLowerCase()) {
        updateData.buyerSigned = true
        updateData.buyerSignedAt = new Date()
      }

      if (isComplete) {
        updateData.isComplete = true
        updateData.completedAt = new Date()
      }

      await prisma.transferCertificate.update({
        where: { certificateId: Number(certificateId) },
        data: updateData
      })

    } catch (error) {
      console.error(`Failed to process TransferSigned event:`, error)
    }
  }

  private async processOwnershipTransferred(log: any) {
    try {
      const { productId, from, to } = log.args

      // Find users
      const [fromUser, toUser] = await Promise.all([
        this.findOrCreateUser(from),
        this.findOrCreateUser(to)
      ])

      // Update product ownership
      await prisma.product.update({
        where: { productId: Number(productId) },
        data: {
          currentOwnerId: toUser.id,
          status: 'TRANSFERRED'
        }
      })

      // Create audit log
      await prisma.auditLog.create({
        data: {
          action: 'TRANSFER_COMPLETED',
          description: `Product ${productId} ownership transferred`,
          userId: toUser.id,
          productId: Number(productId),
          transactionHash: log.transactionHash,
          blockNumber: log.blockNumber,
          chainId: this.config.chainId,
          metadata: {
            from: from,
            to: to
          }
        }
      })

    } catch (error) {
      console.error(`Failed to process OwnershipTransferred event:`, error)
    }
  }

  private async findOrCreateUser(address: string) {
    let user = await prisma.user.findUnique({
      where: { address: address.toLowerCase() }
    })

    if (!user) {
      user = await prisma.user.create({
        data: { address: address.toLowerCase() }
      })
    }

    return user
  }

  private async fetchMetadata(metadataHash: string) {
    try {
      // Mock implementation - in reality, fetch from IPFS
      const response = await fetch(`https://ipfs.io/ipfs/${metadataHash}`)
      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      console.error('Failed to fetch metadata:', error)
    }

    // Return default metadata if fetch fails
    return {
      name: 'Unknown Product',
      description: '',
      category: 'Uncategorized',
      images: []
    }
  }
}




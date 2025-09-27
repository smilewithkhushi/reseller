// app/api/transfers/route.ts
import { PrismaClient } from '@/generated/prisma'
import { NextRequest, NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      certificateId,
      productId,
      invoiceId,
      sellerId,
      buyerId,
      certificateHash,
      lighthouseUri,
      contractAddress,
      chainId,
      transactionHash
    } = body

    const transfer = await prisma.transferCertificate.create({
      data: {
        certificateId,
        productId,
        invoiceId,
        sellerId,
        buyerId,
        certificateHash,
        lighthouseUri,
        contractAddress,
        chainId,
        transactionHash,
        timestamp: new Date(),
        sellerSigned: true, // Seller signs when initiating
        sellerSignedAt: new Date()
      },
      include: {
        seller: { select: { id: true, address: true, username: true } },
        buyer: { select: { id: true, address: true, username: true } },
        product: { select: { id: true, name: true } }
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'TRANSFER_INITIATED',
        description: `Transfer certificate initiated for product ${productId}`,
        userId: sellerId,
        productId,
        transferId: certificateId,
        transactionHash,
        chainId
      }
    })

    // Create notification for buyer
    await prisma.notification.create({
      data: {
        userId: buyerId,
        title: 'Transfer Pending',
        message: `Please sign the transfer certificate for ${transfer.product.name}`,
        type: 'TRANSFER_PENDING',
        data: { certificateId, productId }
      }
    })

    return NextResponse.json({ transfer })
  } catch (error) {
    console.error('Transfer creation error:', error)
    return NextResponse.json({ error: 'Failed to create transfer' }, { status: 500 })
  }
}
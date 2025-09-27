// app/api/transfers/[id]/sign/route.ts
import { PrismaClient } from '@/generated/prisma'
import { NextRequest, NextResponse } from 'next/server'


const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const certificateId = parseInt(params.id)
    const { userId, transactionHash } = await request.json()

    const transfer = await prisma.transferCertificate.findUnique({
      where: { certificateId },
      include: { product: true, seller: true, buyer: true }
    })

    if (!transfer) {
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 })
    }

    let updateData: any = {}
    let isBuyer = false

    if (transfer.sellerId === userId && !transfer.sellerSigned) {
      updateData.sellerSigned = true
      updateData.sellerSignedAt = new Date()
    } else if (transfer.buyerId === userId && !transfer.buyerSigned) {
      updateData.buyerSigned = true
      updateData.buyerSignedAt = new Date()
      isBuyer = true
    } else {
      return NextResponse.json({ error: 'Unauthorized or already signed' }, { status: 403 })
    }

    // Check if both parties have signed
    const bothSigned = (transfer.sellerSigned || updateData.sellerSigned) && 
                      (transfer.buyerSigned || updateData.buyerSigned)

    if (bothSigned) {
      updateData.isComplete = true
      updateData.completedAt = new Date()

      // Update product ownership
      await prisma.product.update({
        where: { productId: transfer.productId },
        data: { 
          currentOwnerId: transfer.buyerId,
          status: 'TRANSFERRED'
        }
      })

      // Update invoice status
      await prisma.invoice.update({
        where: { invoiceId: transfer.invoiceId },
        data: { isTransferComplete: true }
      })
    }

    const updatedTransfer = await prisma.transferCertificate.update({
      where: { certificateId },
      data: updateData,
      include: {
        seller: { select: { id: true, address: true, username: true } },
        buyer: { select: { id: true, address: true, username: true } },
        product: { select: { id: true, name: true } }
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: bothSigned ? 'TRANSFER_COMPLETED' : 'TRANSFER_SIGNED',
        description: bothSigned 
          ? `Transfer completed for product ${transfer.product.name}`
          : `Transfer signed by ${isBuyer ? 'buyer' : 'seller'}`,
        userId,
        productId: transfer.productId,
        transferId: certificateId,
        transactionHash
      }
    })

    // Create notifications
    if (bothSigned) {
      // Notify both parties of completion
      await Promise.all([
        prisma.notification.create({
          data: {
            userId: transfer.sellerId,
            title: 'Transfer Completed',
            message: `Ownership of ${transfer.product.name} has been transferred`,
            type: 'TRANSFER_COMPLETED',
            data: { certificateId, productId: transfer.productId }
          }
        }),
        prisma.notification.create({
          data: {
            userId: transfer.buyerId,
            title: 'Transfer Completed',
            message: `You are now the owner of ${transfer.product.name}`,
            type: 'TRANSFER_COMPLETED',
            data: { certificateId, productId: transfer.productId }
          }
        })
      ])
    } else if (isBuyer) {
      // Notify seller that buyer has signed
      await prisma.notification.create({
        data: {
          userId: transfer.sellerId,
          title: 'Transfer Signed',
          message: `Buyer has signed the transfer for ${transfer.product.name}`,
          type: 'TRANSFER_SIGNED',
          data: { certificateId, productId: transfer.productId }
        }
      })
    }

    return NextResponse.json({ transfer: updatedTransfer })
  } catch (error) {
    console.error('Transfer signing error:', error)
    return NextResponse.json({ error: 'Failed to sign transfer' }, { status: 500 })
  }
}
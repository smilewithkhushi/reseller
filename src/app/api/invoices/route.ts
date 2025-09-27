// app/api/invoices/route.ts
import { PrismaClient } from '@/generated/prisma'
import { NextRequest, NextResponse } from 'next/server'


const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      invoiceId,
      productId,
      sellerId,
      buyerId,
      amount,
      currency,
      description,
      paymentTerms,
      dueDate,
      invoiceHash,
      lighthouseUri,
      contractAddress,
      chainId,
      transactionHash
    } = body

    const invoice = await prisma.invoice.create({
      data: {
        invoiceId,
        productId,
        sellerId,
        buyerId,
        amount,
        currency,
        description,
        paymentTerms,
        dueDate: dueDate ? new Date(dueDate) : null,
        invoiceHash,
        lighthouseUri,
        contractAddress,
        chainId,
        transactionHash,
        timestamp: new Date(),
        status: 'PENDING'
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
        action: 'INVOICE_CREATED',
        description: `Invoice created for product ${productId}`,
        userId: sellerId,
        productId,
        invoiceId,
        transactionHash,
        chainId
      }
    })

    // Create notification for buyer
    await prisma.notification.create({
      data: {
        userId: buyerId,
        title: 'New Invoice Received',
        message: `You have received an invoice for ${invoice.product.name}`,
        type: 'INVOICE_RECEIVED',
        data: { invoiceId, productId }
      }
    })

    return NextResponse.json({ invoice })
  } catch (error) {
    console.error('Invoice creation error:', error)
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
  }
}
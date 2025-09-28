// app/api/products/[id]/route.ts
import { PrismaClient } from '@/generated/prisma'
import { NextRequest, NextResponse } from 'next/server'


const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const productId = parseInt(id)

    const product = await prisma.product.findUnique({
      where: { productId },
      include: {
        initialOwner: {
          select: { id: true, address: true, username: true, avatar: true }
        },
        currentOwner: {
          select: { id: true, address: true, username: true, avatar: true }
        },
        invoices: {
          include: {
            seller: { select: { id: true, address: true, username: true } },
            buyer: { select: { id: true, address: true, username: true } }
          },
          orderBy: { createdAt: 'desc' }
        },
        transfers: {
          include: {
            seller: { select: { id: true, address: true, username: true } },
            buyer: { select: { id: true, address: true, username: true } }
          },
          orderBy: { createdAt: 'desc' }
        },
        tags: true,
        auditLogs: {
          include: {
            user: { select: { id: true, address: true, username: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Product fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const productId = parseInt(id)
    const body = await request.json()
    const { name, description, category, images, tags, userId } = body

    const product = await prisma.product.update({
      where: { productId },
      data: {
        name,
        description,
        category,
        images,
        updatedAt: new Date()
      },
      include: {
        currentOwner: {
          select: { id: true, address: true, username: true }
        }
      }
    })

    // Update tags if provided
    if (tags) {
      await prisma.product.update({
        where: { productId },
        data: {
          tags: {
            set: tags.map((tagId: string) => ({ id: tagId }))
          }
        }
      })
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'PRODUCT_UPDATED',
        description: `Product ${name} updated`,
        userId,
        productId
      }
    })

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Product update error:', error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}
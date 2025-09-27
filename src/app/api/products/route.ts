// app/api/products/route.ts
import { PrismaClient } from '@/generated/prisma'
import { NextRequest, NextResponse } from 'next/server'


const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const category = searchParams.get('category')
    const owner = searchParams.get('owner')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    const where: any = {}
    if (category) where.category = category
    if (owner) where.currentOwner = { address: owner }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { manufacturer: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          currentOwner: {
            select: { id: true, address: true, username: true, avatar: true }
          },
          tags: true,
          _count: {
            select: { invoices: true, transfers: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ])

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Products fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      productId, 
      name, 
      description, 
      category, 
      manufacturer, 
      model, 
      serialNumber,
      metadataHash,
      metadataUri,
      images,
      contractAddress,
      chainId,
      transactionHash,
      ownerId
    } = body

    const product = await prisma.product.create({
      data: {
        productId,
        name,
        description,
        category,
        manufacturer,
        model,
        serialNumber,
        metadataHash,
        metadataUri,
        images: images || [],
        contractAddress,
        chainId,
        transactionHash,
        registrationTimestamp: new Date(),
        initialOwnerId: ownerId,
        currentOwnerId: ownerId,
        status: 'ACTIVE'
      },
      include: {
        currentOwner: {
          select: { id: true, address: true, username: true }
        }
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'PRODUCT_REGISTERED',
        description: `Product ${name} registered`,
        userId: ownerId,
        productId: productId,
        transactionHash,
        chainId
      }
    })

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Product creation error:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}
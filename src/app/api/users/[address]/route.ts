
import { PrismaClient } from '@/generated/prisma'
import { NextRequest, NextResponse } from 'next/server'


const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address: addressParam } = await params
    const address = addressParam.toLowerCase()

    const user = await prisma.user.findUnique({
      where: { address },
      include: {
        ownedProducts: {
          include: {
            _count: { select: { invoices: true, transfers: true } }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        sentInvoices: {
          include: {
            product: { select: { name: true } },
            buyer: { select: { address: true, username: true } }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        receivedInvoices: {
          include: {
            product: { select: { name: true } },
            seller: { select: { address: true, username: true } }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        notifications: {
          where: { read: false },
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('User fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address: addressParam } = await params
    const address = addressParam.toLowerCase()
    const body = await request.json()
    const { username, email, bio, website, avatar } = body

    const user = await prisma.user.update({
      where: { address },
      data: {
        username,
        email,
        bio,
        website,
        avatar,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('User update error:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
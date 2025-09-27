// app/api/search/route.ts
import { PrismaClient } from '@/generated/prisma'
import { NextRequest, NextResponse } from 'next/server'


const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const type = searchParams.get('type') || 'all'

    if (!query || query.length < 2) {
      return NextResponse.json({ error: 'Query too short' }, { status: 400 })
    }

    const results: any = {}

    if (type === 'all' || type === 'products') {
      results.products = await prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { manufacturer: { contains: query, mode: 'insensitive' } },
            { serialNumber: { contains: query, mode: 'insensitive' } },
            { sku: { contains: query, mode: 'insensitive' } }
          ]
        },
        include: {
          currentOwner: { select: { address: true, username: true } }
        },
        take: 10
      })
    }

    if (type === 'all' || type === 'users') {
      results.users = await prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: query, mode: 'insensitive' } },
            { address: { contains: query, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          address: true,
          username: true,
          avatar: true,
          verified: true
        },
        take: 10
      })
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
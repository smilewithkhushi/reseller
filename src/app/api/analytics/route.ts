

// app/api/analytics/route.ts
import { PrismaClient } from '@/generated/prisma'
import { NextRequest, NextResponse } from 'next/server'


const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d'

    const now = new Date()
    const startDate = new Date()
    
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 30)
    }

    // Get analytics data
    const [
      totalProducts,
      totalInvoices,
      totalTransfers,
      totalUsers,
      recentProducts,
      recentInvoices,
      recentTransfers,
      productsByCategory,
      transfersByStatus
    ] = await Promise.all([
      // Total counts
      prisma.product.count({
        where: { createdAt: { gte: startDate } }
      }),
      prisma.invoice.count({
        where: { createdAt: { gte: startDate } }
      }),
      prisma.transferCertificate.count({
        where: { createdAt: { gte: startDate } }
      }),
      prisma.user.count({
        where: { createdAt: { gte: startDate } }
      }),

      // Recent activity
      prisma.product.findMany({
        where: { createdAt: { gte: startDate } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          name: true,
          createdAt: true,
          currentOwner: { select: { address: true, username: true } }
        }
      }),
      prisma.invoice.findMany({
        where: { createdAt: { gte: startDate } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          amount: true,
          currency: true,
          createdAt: true,
          product: { select: { name: true } },
          seller: { select: { address: true, username: true } }
        }
      }),
      prisma.transferCertificate.findMany({
        where: { createdAt: { gte: startDate } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          isComplete: true,
          createdAt: true,
          product: { select: { name: true } },
          seller: { select: { address: true, username: true } },
          buyer: { select: { address: true, username: true } }
        }
      }),

      // Group by category
      prisma.product.groupBy({
        by: ['category'],
        where: { 
          createdAt: { gte: startDate },
          category: { not: null }
        },
        _count: { category: true }
      }),

      // Transfer status breakdown
      prisma.transferCertificate.groupBy({
        by: ['isComplete'],
        where: { createdAt: { gte: startDate } },
        _count: { isComplete: true }
      })
    ])

    return NextResponse.json({
      summary: {
        totalProducts,
        totalInvoices,
        totalTransfers,
        totalUsers
      },
      recent: {
        products: recentProducts,
        invoices: recentInvoices,
        transfers: recentTransfers
      },
      charts: {
        productsByCategory: productsByCategory.map(item => ({
          category: item.category || 'Uncategorized',
          count: item._count.category
        })),
        transfersByStatus: transfersByStatus.map(item => ({
          status: item.isComplete ? 'Completed' : 'Pending',
          count: item._count.isComplete
        }))
      }
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
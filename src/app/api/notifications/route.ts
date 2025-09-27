
// app/api/notifications/route.ts
import { PrismaClient } from '@/generated/prisma'
import { NextRequest, NextResponse } from 'next/server'


const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly && { read: false })
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error('Notifications fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { notificationIds, userId } = await request.json()

    await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId
      },
      data: {
        read: true,
        readAt: new Date()
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Notifications update error:', error)
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
  }
}

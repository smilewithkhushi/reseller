// app/api/auth/route.ts
import { NextRequest, NextResponse } from 'next/server'

import { verifyMessage } from 'ethers'
import { PrismaClient } from '@/generated/prisma'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { address, signature, message } = await request.json()

    // Verify the signature
    const recoveredAddress = verifyMessage(message, signature)
    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { address: address.toLowerCase() }
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          address: address.toLowerCase(),
        }
      })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}




















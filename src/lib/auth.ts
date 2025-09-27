

// lib/auth.ts
import { NextRequest } from 'next/server'
import { prisma } from './prisma'

export async function getAuthUser(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)
    // Implement JWT verification here
    // For now, we'll assume the token is the user address
    const address = token.toLowerCase()

    const user = await prisma.user.findUnique({
      where: { address }
    })

    return user
  } catch (error) {
    console.error('Auth error:', error)
    return null
  }
}

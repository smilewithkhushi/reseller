import { NextRequest } from 'next/server'
import { createPublicClient, http } from 'viem'
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '@/config/contract'

const client = createPublicClient({
  transport: http(process.env.RPC_URL)
})

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  
  if (!id) {
    return Response.json({ error: 'Invoice ID required' }, { status: 400 })
  }

  try {
    const invoice = await client.readContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: CONTRACT_ABI,
      functionName: 'getInvoice',
      args: [BigInt(id)]
    })
    
    return Response.json(invoice)
  } catch (error) {
    return Response.json({ error: 'Invoice not found' }, { status: 404 })
  }
}
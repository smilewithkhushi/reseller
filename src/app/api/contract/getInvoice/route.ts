import { NextRequest } from 'next/server'
import { createPublicClient, http } from 'viem'
import { polygon, polygonMumbai } from 'viem/chains'
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '@/config/contract'

// Create client with fallback configuration
const getRpcUrl = () => {
  return process.env.RPC_URL || 
         process.env.NEXT_PUBLIC_RPC_URL || 
         'https://polygon-rpc.com' // fallback
}

const getChain = () => {
  const chainId = process.env.NEXT_PUBLIC_CHAIN_ID || '137'
  return chainId === '80001' ? polygonMumbai : polygon
}

const client = createPublicClient({
  chain: getChain(),
  transport: http(getRpcUrl())
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
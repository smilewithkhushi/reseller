
'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '@/config/contract'
import { CheckCircle, Clock, FileCheck, Loader2, PenTool } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useAccount, useReadContract, useTransactionReceipt, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'

interface TransferCertificate {
  certificateId: bigint
  productId: bigint
  invoiceId: bigint
  seller: string
  buyer: string
  certificateHash: string
  lighthouseURI: string
  sellerSigned: boolean
  buyerSigned: boolean
  timestamp: bigint
  isComplete: boolean
}

export function TransferCertificate() {
  const [invoiceId, setInvoiceId] = useState('')
  const [certificateId, setCertificateId] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const { address } = useAccount()

  // Get invoice details
  const { data: invoiceData } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'getInvoice',
    args: invoiceId ? [BigInt(invoiceId)] : undefined,
    query: {
      enabled: !!invoiceId,
    },
  })

  // Get transfer certificate details
  const { data: certificateData } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'getTransferCertificate',
    args: certificateId ? [BigInt(certificateId)] : undefined,
    query: {
      enabled: !!certificateId,
    },
  })

  // Initiate transfer
  const { 
    data: initiateData, 
    writeContract: initiateWrite, 
    isPending: isInitiating 
  } = useWriteContract()

  const { isLoading: isInitiateConfirming, isSuccess: isInitiateSuccess } = useWaitForTransactionReceipt({
    hash: initiateData,
  })

  // Sign transfer
  const { 
    data: signData, 
    writeContract: signWrite, 
    isPending: isSigning 
  } = useWriteContract()

  const { isLoading: isSignConfirming, isSuccess: isSignSuccess } = useTransactionReceipt({
    hash: signData,
  })

  const uploadCertificateToLighthouse = async (certificateData: any): Promise<string> => {
    // Mock implementation - replace with actual Lighthouse integration
    await new Promise(resolve => setTimeout(resolve, 1500))
    const hash = 'Qm' + Math.random().toString(36).substring(2, 15)
    return `https://gateway.lighthouse.storage/ipfs/${hash}`
  }

  const handleInitiateTransfer = async () => {
    if (!invoiceId || !invoiceData) {
      toast.error("Validation Error", {
        description: "Please enter a valid invoice ID",
      })
      return
    }

    const invoice = invoiceData as any
    if (invoice.seller !== address) {
      toast.error("Authorization Error", {
        description: "Only the seller can initiate the transfer",
      })
      return
    }

    try {
      setIsUploading(true)

      // Create certificate data
      const certificateData = {
        invoiceId: invoiceId,
        productId: invoice.productId.toString(),
        seller: invoice.seller,
        buyer: invoice.buyer,
        timestamp: Date.now(),
        amount: "Transfer initiated"
      }

      // Upload to Lighthouse
      const lighthouseURI = await uploadCertificateToLighthouse(certificateData)

      // Create certificate hash
      const certificateHash = btoa(JSON.stringify(certificateData)).slice(0, 32)

      // Initiate transfer on blockchain
      initiateWrite({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: 'initiateTransfer',
        args: [
          BigInt(invoiceId),
          certificateHash,
          lighthouseURI
        ]
      })

      toast.success("Transfer Initiated", {
        description: "Transfer certificate creation sent to blockchain",
      })

    } catch (error) {
      console.error('Transfer initiation error:', error)
      toast.error("Initiation Failed", {
        description: "Failed to initiate transfer. Please try again.",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleSignTransfer = async () => {
    if (!certificateId || !certificateData) {
      toast.error("Validation Error", {
        description: "Please enter a valid certificate ID",
      })
      return
    }

    const certificate = certificateData as TransferCertificate
    if (certificate.seller !== address && certificate.buyer !== address) {
      toast.error("Authorization Error", {
        description: "Only the seller or buyer can sign this transfer",
      })
      return
    }

    try {
      signWrite({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: 'signTransfer',
        args: [BigInt(certificateId)]
      })

      toast.success("Signature Initiated", {
        description: "Transfer signature sent to blockchain",
      })

    } catch (error) {
      console.error('Transfer signing error:', error)
      toast.error("Signing Failed", {
        description: "Failed to sign transfer. Please try again.",
      })
    }
  }

  const isLoading = isUploading || isInitiating || isInitiateConfirming || isSigning || isSignConfirming

  return (
    <div className="space-y-6">
      {/* Initiate Transfer Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Initiate Transfer
          </CardTitle>
          <CardDescription>
            Sellers can initiate a transfer certificate for an existing invoice
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invoiceId">Invoice ID</Label>
            <Input
              id="invoiceId"
              type="number"
              value={invoiceId}
              onChange={(e) => setInvoiceId(e.target.value)}
              placeholder="Enter invoice ID"
            />
            {/* {invoiceData && (
              <div className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                Invoice found - Seller: {(invoiceData as any)?.seller?.slice(0, 8)}..., 
                Buyer: {(invoiceData as any)?.buyer?.slice(0, 8)}... 
              </div>
            )} */}
          </div>

          {isInitiateSuccess && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                Transfer initiated successfully! Transaction hash: {initiateData?.slice(0, 10)}...
              </AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={handleInitiateTransfer}
            disabled={isLoading || !invoiceData}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isUploading ? 'Creating certificate...' : 'Confirming...'}
              </>
            ) : (
              <>
                <PenTool className="mr-2 h-4 w-4" />
                Initiate Transfer
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Sign Transfer Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PenTool className="h-5 w-5" />
            Sign Transfer
          </CardTitle>
          <CardDescription>
            Both seller and buyer must sign to complete the transfer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="certificateId">Certificate ID</Label>
            <Input
              id="certificateId"
              type="number"
              value={certificateId}
              onChange={(e) => setCertificateId(e.target.value)}
              placeholder="Enter certificate ID"
            />
            {/* {certificateData && (
              <div className="space-y-2">
                <div className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  Certificate found
                </div>
                <TransferStatus certificate={certificateData as TransferCertificate} userAddress={address} />
              </div>
            )} */}
          </div>

          {isSignSuccess && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                Transfer signed successfully! Transaction hash: {signData?.slice(0, 10)}...
              </AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={handleSignTransfer}
            disabled={isLoading || !certificateData}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing...
              </>
            ) : (
              <>
                <PenTool className="mr-2 h-4 w-4" />
                Sign Transfer
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// Transfer Status Component
function TransferStatus({ 
  certificate, 
  userAddress 
}: { 
  certificate: TransferCertificate
  userAddress?: string 
}) {
  const isSeller = certificate.seller === userAddress
  const isBuyer = certificate.buyer === userAddress
  
  return (
    <div className="bg-slate-50 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Transfer Status</span>
        {certificate.isComplete ? (
          <span className="inline-flex items-center gap-1 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            Complete
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-sm text-yellow-600">
            <Clock className="h-4 w-4" />
            Pending
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="font-medium text-slate-700">Seller</div>
          <div className="text-slate-500 font-mono">
            {certificate.seller.slice(0, 8)}...
            {isSeller && <span className="text-blue-600 ml-1">(You)</span>}
          </div>
          <div className="flex items-center gap-1 mt-1">
            {certificate.sellerSigned ? (
              <>
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span className="text-green-600">Signed</span>
              </>
            ) : (
              <>
                <Clock className="h-3 w-3 text-yellow-500" />
                <span className="text-yellow-600">Pending</span>
              </>
            )}
          </div>
        </div>

        <div>
          <div className="font-medium text-slate-700">Buyer</div>
          <div className="text-slate-500 font-mono">
            {certificate.buyer.slice(0, 8)}...
            {isBuyer && <span className="text-blue-600 ml-1">(You)</span>}
          </div>
          <div className="flex items-center gap-1 mt-1">
            {certificate.buyerSigned ? (
              <>
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span className="text-green-600">Signed</span>
              </>
            ) : (
              <>
                <Clock className="h-3 w-3 text-yellow-500" />
                <span className="text-yellow-600">Pending</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="text-xs text-slate-500 pt-2 border-t">
        Product ID: {certificate.productId.toString()} | 
        Invoice ID: {certificate.invoiceId.toString()}
      </div>
    </div>
  )
}
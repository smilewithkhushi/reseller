'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '@/config/contract'
import { 
  CheckCircle, 
  Clock, 
  FileCheck, 
  Loader2, 
  PenTool,
  ArrowRight,
  User,
  FileText,
  Hash,
  ExternalLink,
  AlertCircle,
  Copy
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'

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

interface Invoice {
  invoiceId: bigint
  productId: bigint
  seller: string
  buyer: string
  invoiceHash: string
  lighthouseURI: string
  timestamp: bigint
  isTransferComplete: boolean
}

export function TransferCertificate() {
  const [invoiceId, setInvoiceId] = useState('')
  const [certificateId, setCertificateId] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([])
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false)
  const { address } = useAccount()

  // Get invoice details
  const { data: invoiceData, isLoading: invoiceLoading } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'getInvoice',
    args: invoiceId ? [BigInt(invoiceId)] : undefined,
    query: {
      enabled: !!invoiceId,
    },
  })

  // Get certificate details
  const { data: certificateData, isLoading: certificateLoading } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'getTransferCertificate',
    args: certificateId ? [BigInt(certificateId)] : undefined,
    query: {
      enabled: !!certificateId,
    },
  })

  // Get total invoice count
  const { data: invoiceCount } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'getInvoiceCount',
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

  const { isLoading: isSignConfirming, isSuccess: isSignSuccess } = useWaitForTransactionReceipt({
    hash: signData,
  })

  // Fetch all invoices
  useEffect(() => {
    const fetchAllInvoices = async () => {
      if (!invoiceCount) return
      
      setIsLoadingInvoices(true)
      const invoices: Invoice[] = []
      
      try {
        // Fetch each invoice individually
        for (let i = 1; i <= Number(invoiceCount); i++) {
          try {
            const response = await fetch(`/api/contract/getInvoice?id=${i}`)
            if (response.ok) {
              const invoice = await response.json()
              invoices.push(invoice)
            }
          } catch (error) {
            console.error(`Error fetching invoice ${i}:`, error)
          }
        }
        setAllInvoices(invoices)
      } catch (error) {
        console.error('Error fetching invoices:', error)
      } finally {
        setIsLoadingInvoices(false)
      }
    }

    fetchAllInvoices()
  }, [invoiceCount])

  const uploadCertificateToLighthouse = async (certificateData: any): Promise<string> => {
    const lighthouseApiKey = process.env.NEXT_PUBLIC_LIGHTHOUSE_API_KEY
    if (!lighthouseApiKey) {
      throw new Error('Lighthouse API key is not configured')
    }

    try {
      // Mock implementation - replace with actual Lighthouse SDK
      await new Promise(resolve => setTimeout(resolve, 1500))
      const hash = 'Qm' + Math.random().toString(36).substring(2, 15)
      return `https://gateway.lighthouse.storage/ipfs/${hash}`
    } catch (error) {
      console.error('Lighthouse upload error:', error)
      throw new Error('Failed to upload certificate to Lighthouse')
    }
  }

  const handleInitiateTransfer = async () => {
    if (!invoiceId || !invoiceData) {
      toast.error("Please enter a valid invoice ID")
      return
    }

    const invoice = invoiceData as Invoice
    if (invoice.seller !== address) {
      toast.error("Only the seller can initiate the transfer")
      return
    }

    try {
      setIsUploading(true)
      const certificateData = {
        invoiceId,
        productId: invoice.productId.toString(),
        seller: invoice.seller,
        buyer: invoice.buyer,
        timestamp: Date.now(),
      }

      const lighthouseURI = await uploadCertificateToLighthouse(certificateData)
      const certificateHash = btoa(JSON.stringify(certificateData)).slice(0, 32)

      initiateWrite({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: 'initiateTransfer',
        args: [BigInt(invoiceId), certificateHash, lighthouseURI]
      })

      toast.success("Transfer initiated successfully!")
    } catch (error) {
      console.error('Transfer initiation error:', error)
      toast.error("Failed to initiate transfer")
    } finally {
      setIsUploading(false)
    }
  }

  const handleSignTransfer = async () => {
    if (!certificateId || !certificateData) {
      toast.error("Please enter a valid certificate ID")
      return
    }

    const certificate = certificateData as TransferCertificate
    if (certificate.seller !== address && certificate.buyer !== address) {
      toast.error("Only the seller or buyer can sign this transfer")
      return
    }

    try {
      signWrite({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: 'signTransfer',
        args: [BigInt(certificateId)]
      })

      toast.success("Transfer signature initiated!")
    } catch (error) {
      console.error('Transfer signing error:', error)
      toast.error("Failed to sign transfer")
    }
  }

  const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`
  const formatTimestamp = (timestamp: bigint) => new Date(Number(timestamp) * 1000).toLocaleString()
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard!")
  }

  const isLoading = isUploading || isInitiating || isInitiateConfirming || isSigning || isSignConfirming

  return (
    <div className="space-y-6">
      {/* All Invoices Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Available Invoices
          </CardTitle>
          <CardDescription>
            All invoices in the system - select one to initiate transfer
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingInvoices ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading invoices...
            </div>
          ) : allInvoices.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No Invoices Found</h3>
              <p className="text-slate-600">Create an invoice first to enable transfers</p>
            </div>
          ) : (
            <div className="grid gap-3 max-h-96 overflow-y-auto">
              {allInvoices.map((invoice) => (
                <div 
                  key={invoice.invoiceId.toString()} 
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded">
                      <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">Invoice #{invoice.invoiceId.toString()}</div>
                      <div className="text-sm text-slate-600">
                        Product #{invoice.productId.toString()} • {formatTimestamp(invoice.timestamp)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {formatAddress(invoice.seller)} → {formatAddress(invoice.buyer)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={invoice.isTransferComplete ? "default" : "secondary"}>
                      {invoice.isTransferComplete ? "Complete" : "Available"}
                    </Badge>
                    {!invoice.isTransferComplete && invoice.seller === address && (
                      <Button 
                        size="sm" 
                        onClick={() => setInvoiceId(invoice.invoiceId.toString())}
                      >
                        Select
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                    >
                      <a href={invoice.lighthouseURI} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Initiate Transfer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Initiate Transfer
          </CardTitle>
          <CardDescription>Create a transfer certificate for an invoice</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invoiceId">Invoice ID</Label>
            <Input
              id="invoiceId"
              type="number"
              value={invoiceId}
              onChange={(e) => setInvoiceId(e.target.value)}
              placeholder="Enter invoice ID or select from above"
            />
          </div>

          {!!invoiceData && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Invoice #{(invoiceData as Invoice).invoiceId.toString()}</span>
                <Badge variant={(invoiceData as Invoice).isTransferComplete ? "default" : "secondary"}>
                  {(invoiceData as Invoice).isTransferComplete ? "Complete" : "Available"}
                </Badge>
              </div>
              <div className="text-sm text-slate-600">
                Seller: {formatAddress((invoiceData as Invoice).seller)} 
                {(invoiceData as Invoice).seller === address && <span className="text-blue-600 ml-1">(You)</span>}
              </div>
              <div className="text-sm text-slate-600">
                Buyer: {formatAddress((invoiceData as Invoice).buyer)}
              </div>
            </div>
          )}

          {isInitiateSuccess && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                Transfer initiated! Transaction: {initiateData?.slice(0, 20)}...
              </AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={handleInitiateTransfer}
            disabled={isLoading || !invoiceData || (invoiceData as Invoice)?.seller !== address}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isUploading ? 'Creating certificate...' : 'Confirming...'}
              </>
            ) : (
              <>
                <ArrowRight className="mr-2 h-4 w-4" />
                Initiate Transfer
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Sign Transfer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PenTool className="h-5 w-5" />
            Sign Transfer
          </CardTitle>
          <CardDescription>Sign a transfer certificate to complete ownership transfer</CardDescription>
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
          </div>

          {!!certificateData && (
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Certificate #{(certificateData as TransferCertificate).certificateId.toString()}</span>
                <Badge variant={(certificateData as TransferCertificate).isComplete ? "default" : "secondary"}>
                  {(certificateData as TransferCertificate).isComplete ? "Complete" : "Pending"}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  Seller: {formatAddress((certificateData as TransferCertificate).seller)}
                  {(certificateData as TransferCertificate).sellerSigned && <CheckCircle className="inline h-3 w-3 text-green-500 ml-1" />}
                </div>
                <div>
                  Buyer: {formatAddress((certificateData as TransferCertificate).buyer)}
                  {(certificateData as TransferCertificate).buyerSigned && <CheckCircle className="inline h-3 w-3 text-green-500 ml-1" />}
                </div>
              </div>
            </div>
          )}

          {isSignSuccess && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                Transfer signed! Transaction: {signData?.slice(0, 20)}...
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
'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '@/config/contract'
import { 
  CheckCircle, 
  Clock, 
  FileCheck, 
  Loader2, 
  PenTool,
  ArrowRight,
  User,
  Shield,
  FileText,
  Package,
  Calendar,
  Hash,
  ExternalLink,
  Search,
  AlertCircle,
  Copy,
  Sparkles,
  Users,
  Timer,
  Download
} from 'lucide-react'
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
  const [activeTab, setActiveTab] = useState('initiate')
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

  // Get transfer certificate details
  const { data: certificateData, isLoading: certificateLoading } = useReadContract({
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

      toast.success("Transfer initiated successfully!")

    } catch (error) {
      console.error('Transfer initiation error:', error)
      toast.error("Failed to initiate transfer. Please try again.")
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
      toast.error("Failed to sign transfer. Please try again.")
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard!")
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatTimestamp = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleString()
  }

  const isLoading = isUploading || isInitiating || isInitiateConfirming || isSigning || isSignConfirming

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-50 to-indigo-50 opacity-50" />
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <ArrowRight className="h-5 w-5 text-white" />
                </div>
                Transfer Certificate Management
              </CardTitle>
              <CardDescription className="mt-2">
                Initiate and manage ownership transfers with dual-signature verification
              </CardDescription>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600">
              <Shield className="h-4 w-4" />
              Dual Signature Required
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="initiate" className="flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            Initiate Transfer
          </TabsTrigger>
          <TabsTrigger value="sign" className="flex items-center gap-2">
            <PenTool className="h-4 w-4" />
            Sign Transfer
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search Transfers
          </TabsTrigger>
        </TabsList>

        {/* Initiate Transfer Tab */}
        <TabsContent value="initiate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5" />
                Initiate New Transfer
              </CardTitle>
              <CardDescription>
                Sellers can create a transfer certificate for an existing invoice
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Invoice Search */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="invoiceId" className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Invoice ID
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="invoiceId"
                      type="number"
                      value={invoiceId}
                      onChange={(e) => setInvoiceId(e.target.value)}
                      placeholder="Enter invoice ID to search"
                      className="flex-1"
                    />
                    {invoiceLoading && (
                      <div className="flex items-center px-3">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Invoice Information Display */}
                {invoiceData && (
                  <InvoiceDisplay invoice={invoiceData as Invoice} userAddress={address} />
                )}

                {invoiceId && !invoiceData && !invoiceLoading && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Invoice not found. Please check the invoice ID and try again.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Transfer Initiation */}
              <div className="border-t pt-6">
                <div className="space-y-4">
                  {isInitiateSuccess && (
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-700">
                        Transfer initiated successfully! Transaction hash: {initiateData?.slice(0, 20)}...
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    onClick={handleInitiateTransfer}
                    disabled={isLoading || !invoiceData || (invoiceData as Invoice)?.seller !== address}
                    className="w-full h-12"
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        {isUploading ? 'Creating certificate...' : 'Confirming transaction...'}
                      </>
                    ) : (
                      <>
                        <FileCheck className="mr-2 h-5 w-5" />
                        Initiate Transfer Certificate
                      </>
                    )}
                  </Button>

                  {invoiceData && (invoiceData as Invoice).seller !== address && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Only the seller can initiate a transfer for this invoice.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sign Transfer Tab */}
        <TabsContent value="sign" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PenTool className="h-5 w-5" />
                Sign Transfer Certificate
              </CardTitle>
              <CardDescription>
                Both seller and buyer must sign to complete the ownership transfer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Certificate Search */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="certificateId" className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Certificate ID
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="certificateId"
                      type="number"
                      value={certificateId}
                      onChange={(e) => setCertificateId(e.target.value)}
                      placeholder="Enter certificate ID to search"
                      className="flex-1"
                    />
                    {certificateLoading && (
                      <div className="flex items-center px-3">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Certificate Information Display */}
                {certificateData && (
                  <CertificateDisplay certificate={certificateData as TransferCertificate} userAddress={address} />
                )}

                {certificateId && !certificateData && !certificateLoading && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Certificate not found. Please check the certificate ID and try again.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Transfer Signing */}
              <div className="border-t pt-6">
                <div className="space-y-4">
                  {isSignSuccess && (
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-700">
                        Transfer signed successfully! Transaction hash: {signData?.slice(0, 20)}...
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    onClick={handleSignTransfer}
                    disabled={isLoading || !certificateData || isTransferCompleteOrNotAuthorized()}
                    className="w-full h-12"
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Signing transfer...
                      </>
                    ) : (
                      <>
                        <PenTool className="mr-2 h-5 w-5" />
                        Sign Transfer Certificate
                      </>
                    )}
                  </Button>

                  {certificateData && isTransferCompleteOrNotAuthorized() && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {(certificateData as TransferCertificate).isComplete 
                          ? "This transfer is already complete."
                          : "You are not authorized to sign this transfer."}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Search Transfers Tab */}
        <TabsContent value="search" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Transfers
              </CardTitle>
              <CardDescription>
                Search and view transfer certificates by various criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">Advanced Search</h3>
                <p className="text-slate-600 mb-6">
                  Search functionality will be available in the next update
                </p>
                <Button variant="outline">
                  Request Feature
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )

  function isTransferCompleteOrNotAuthorized(): boolean {
    if (!certificateData || !address) return true
    const cert = certificateData as TransferCertificate
    const isAuthorized = cert.seller === address || cert.buyer === address
    return cert.isComplete || !isAuthorized
  }
}

// Invoice Display Component
function InvoiceDisplay({ invoice, userAddress }: { invoice: Invoice, userAddress?: string }) {
  const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`
  const formatTimestamp = (timestamp: bigint) => new Date(Number(timestamp) * 1000).toLocaleString()

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-900">Invoice #{invoice.invoiceId.toString()}</h4>
              <p className="text-sm text-blue-700">Product #{invoice.productId.toString()}</p>
            </div>
          </div>
          <Badge variant={invoice.isTransferComplete ? "default" : "secondary"}>
            {invoice.isTransferComplete ? "Transfer Complete" : "Pending Transfer"}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-blue-700">Seller</Label>
            <div className="flex items-center gap-2 mt-1">
              <User className="h-4 w-4 text-blue-500" />
              <code className="text-sm bg-blue-100 px-2 py-1 rounded">{formatAddress(invoice.seller)}</code>
              {invoice.seller === userAddress && (
                <Badge variant="outline" className="text-xs">You</Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(invoice.seller)}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-blue-700">Buyer</Label>
            <div className="flex items-center gap-2 mt-1">
              <User className="h-4 w-4 text-blue-500" />
              <code className="text-sm bg-blue-100 px-2 py-1 rounded">{formatAddress(invoice.buyer)}</code>
              {invoice.buyer === userAddress && (
                <Badge variant="outline" className="text-xs">You</Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(invoice.buyer)}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-blue-200">
          <div className="text-sm text-blue-600">
            <Calendar className="h-4 w-4 inline mr-1" />
            Created: {formatTimestamp(invoice.timestamp)}
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href={invoice.lighthouseURI} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3 mr-1" />
              View Invoice
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Certificate Display Component
function CertificateDisplay({ certificate, userAddress }: { certificate: TransferCertificate, userAddress?: string }) {
  const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`
  const formatTimestamp = (timestamp: bigint) => new Date(Number(timestamp) * 1000).toLocaleString()

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const isSeller = certificate.seller === userAddress
  const isBuyer = certificate.buyer === userAddress
  const signaturesComplete = (certificate.sellerSigned ? 1 : 0) + (certificate.buyerSigned ? 1 : 0)

  return (
    <Card className="bg-purple-50 border-purple-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FileCheck className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <h4 className="font-semibold text-purple-900">Certificate #{certificate.certificateId.toString()}</h4>
              <p className="text-sm text-purple-700">
                Product #{certificate.productId.toString()} • Invoice #{certificate.invoiceId.toString()}
              </p>
            </div>
          </div>
          <Badge variant={certificate.isComplete ? "default" : "secondary"}>
            {certificate.isComplete ? "Complete" : "Pending Signatures"}
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-purple-700 font-medium">Signature Progress</span>
            <span className="text-purple-900 font-semibold">{signaturesComplete}/2</span>
          </div>
          <Progress value={signaturesComplete * 50} className="h-2" />
        </div>

        {/* Participants */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-purple-700">Seller</Label>
            <div className="flex items-center justify-between p-2 bg-purple-100 rounded">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-purple-500" />
                <code className="text-sm">{formatAddress(certificate.seller)}</code>
                {isSeller && <Badge variant="outline" className="text-xs">You</Badge>}
              </div>
              <div className="flex items-center gap-2">
                {certificate.sellerSigned ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-green-600 font-medium">Signed</span>
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <span className="text-xs text-yellow-600 font-medium">Pending</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-purple-700">Buyer</Label>
            <div className="flex items-center justify-between p-2 bg-purple-100 rounded">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-purple-500" />
                <code className="text-sm">{formatAddress(certificate.buyer)}</code>
                {isBuyer && <Badge variant="outline" className="text-xs">You</Badge>}
              </div>
              <div className="flex items-center gap-2">
                {certificate.buyerSigned ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-green-600 font-medium">Signed</span>
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <span className="text-xs text-yellow-600 font-medium">Pending</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-purple-200">
          <div className="text-sm text-purple-600">
            <Calendar className="h-4 w-4 inline mr-1" />
            Created: {formatTimestamp(certificate.timestamp)}
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href={certificate.lighthouseURI} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3 mr-1" />
              View Certificate
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
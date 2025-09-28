'use client';

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useState } from 'react'
import { useReadContract } from 'wagmi'

import { CONTRACT_ABI, CONTRACT_ADDRESS } from '@/config/contract'
import {
    AlertCircle,
    ArrowRight,
    Calendar,
    CheckCircle,
    Clock,
    Copy,
    ExternalLink,
    FileText,
    Filter,
    Hash,
    History,
    Package,
    Search,
    Sparkles,
    Timer,
    TrendingUp,
    User,
    Users
} from 'lucide-react'

interface Product {
  productId: bigint
  initialOwner: string
  currentOwner: string
  registrationTimestamp: bigint
  metadataHash: string
  isRegistered: boolean
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

export function ProductAuditTrail() {
  const [productId, setProductId] = useState('')
  const [searchInitiated, setSearchInitiated] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  // Get product details
  const { data: productData, isError: productError, isLoading: productLoading } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'getProduct',
    args: productId ? [BigInt(productId)] : undefined,
    query: {
      enabled: !!productId && searchInitiated,
    },
  })

  // Get product invoices
  const { data: invoicesData, isLoading: invoicesLoading } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'getProductInvoices',
    args: productId ? [BigInt(productId)] : undefined,
    query: {
      enabled: !!productId && searchInitiated,
    },
  })

  // Get product transfers
  const { data: transfersData, isLoading: transfersLoading } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'getProductTransfers',
    args: productId ? [BigInt(productId)] : undefined,
    query: {
      enabled: !!productId && searchInitiated,
    },
  })

  const handleSearch = () => {
    if (!productId) return
    setSearchInitiated(true)
    setActiveTab('overview')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const isLoading = productLoading || invoicesLoading || transfersLoading

  const product = productData as Product
  const invoices = (invoicesData as Invoice[]) || []
  const transfers = (transfersData as TransferCertificate[]) || []

  return (
    <div className="space-y-6">
      {/* Enhanced Search Section */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 opacity-50" />
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Search className="h-5 w-5 text-white" />
                </div>
                Product Audit Trail
              </CardTitle>
              <CardDescription className="mt-2">
                Enter a product ID to explore its complete blockchain history and provenance trail
              </CardDescription>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600">
              <Sparkles className="h-4 w-4" />
              Blockchain Verified
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="searchProductId" className="text-sm font-medium">Product ID</Label>
              <div className="relative mt-1">
                <Input
                  id="searchProductId"
                  type="number"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter product ID (e.g., 12345)"
                  className="pr-10"
                />
                <Hash className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
              </div>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleSearch} 
                disabled={!productId || isLoading}
                className="px-6"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Timer className="h-4 w-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {/* Quick Stats Preview */}
          {searchInitiated && !productError && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm">
                <Package className="h-4 w-4 text-blue-500" />
                <span className="text-slate-600">Product:</span>
                <span className="font-medium">{productId || '-'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-green-500" />
                <span className="text-slate-600">Invoices:</span>
                <span className="font-medium">{invoices?.length || 0}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <History className="h-4 w-4 text-purple-500" />
                <span className="text-slate-600">Transfers:</span>
                <span className="font-medium">{transfers?.length || 0}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Loading States */}
      {isLoading && searchInitiated && (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      )}

      {/* Results Section */}
      {searchInitiated && !isLoading && (
        <>
          {/* Error State */}
          {productError ? (
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>Product not found. Please verify the product ID and try again.</span>
                <Button variant="outline" size="sm" onClick={() => setProductId('')}>
                  Clear Search
                </Button>
              </AlertDescription>
            </Alert>
          ) : product ? (
            <>
              {/* Tabbed Navigation */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
                  <TabsTrigger value="overview" className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    <span className="hidden sm:inline">Overview</span>
                  </TabsTrigger>
                  <TabsTrigger value="product" className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    <span className="hidden sm:inline">Product</span>
                  </TabsTrigger>
                  <TabsTrigger value="invoices" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="hidden sm:inline">Invoices</span>
                    {invoices.length > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                        {invoices.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="transfers" className="flex items-center gap-2">
                    <History className="h-4 w-4" />
                    <span className="hidden sm:inline">Transfers</span>
                    {transfers.length > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                        {transfers.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  <OverviewSection 
                    product={product} 
                    invoices={invoices} 
                    transfers={transfers} 
                  />
                </TabsContent>

                <TabsContent value="product" className="space-y-6">
                  <ProductInfo product={product} />
                </TabsContent>

                <TabsContent value="invoices" className="space-y-6">
                  <InvoicesSection invoices={invoices} />
                </TabsContent>

                <TabsContent value="transfers" className="space-y-6">
                  <TransfersSection transfers={transfers} />
                </TabsContent>
              </Tabs>
            </>
          ) : null}
        </>
      )}
    </div>
  )
}

// Enhanced Overview Section
function OverviewSection({ 
  product, 
  invoices, 
  transfers 
}: { 
  product: Product, 
  invoices: Invoice[], 
  transfers: TransferCertificate[] 
}) {
  const formatTimestamp = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleString()
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const totalTransactions = invoices.length + transfers.length
  const completedTransfers = transfers.filter(t => t.isComplete).length
  const pendingTransfers = transfers.length - completedTransfers
  const hasChanged = product.currentOwner !== product.initialOwner

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total Activity</p>
                <p className="text-2xl font-bold text-blue-900">{totalTransactions}</p>
              </div>
              <div className="p-2 bg-blue-500 rounded-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Completed</p>
                <p className="text-2xl font-bold text-green-900">{completedTransfers}</p>
              </div>
              <div className="p-2 bg-green-500 rounded-lg">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700">Pending</p>
                <p className="text-2xl font-bold text-yellow-900">{pendingTransfers}</p>
              </div>
              <div className="p-2 bg-yellow-500 rounded-lg">
                <Clock className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Ownership</p>
                <p className="text-lg font-bold text-purple-900">
                  {hasChanged ? 'Transferred' : 'Original'}
                </p>
              </div>
              <div className="p-2 bg-purple-500 rounded-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Activity Timeline
          </CardTitle>
          <CardDescription>
            Chronological view of all product activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TimelineView product={product} invoices={invoices} transfers={transfers} />
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-dashed border-2 border-slate-200 hover:border-blue-300 transition-colors">
          <CardContent className="p-6 text-center">
            <Package className="h-8 w-8 text-slate-400 mx-auto mb-3" />
            <h3 className="font-medium mb-2">Product Details</h3>
            <p className="text-sm text-slate-600 mb-4">
              View complete product information and metadata
            </p>
            <Button variant="outline" size="sm">
              View Details
            </Button>
          </CardContent>
        </Card>

        <Card className="border-dashed border-2 border-slate-200 hover:border-green-300 transition-colors">
          <CardContent className="p-6 text-center">
            <ExternalLink className="h-8 w-8 text-slate-400 mx-auto mb-3" />
            <h3 className="font-medium mb-2">Export Report</h3>
            <p className="text-sm text-slate-600 mb-4">
              Generate a comprehensive audit report
            </p>
            <Button variant="outline" size="sm">
              Export PDF
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Timeline Component
function TimelineView({ 
  product, 
  invoices, 
  transfers 
}: { 
  product: Product, 
  invoices: Invoice[], 
  transfers: TransferCertificate[] 
}) {
  const formatTimestamp = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleString()
  }

  // Combine and sort all events
  const events = [
    {
      type: 'registration',
      timestamp: product.registrationTimestamp,
      title: 'Product Registered',
      description: 'Product was registered on the blockchain',
      icon: Package,
      color: 'blue'
    },
    ...invoices.map(invoice => ({
      type: 'invoice',
      timestamp: invoice.timestamp,
      title: `Invoice #${invoice.invoiceId}`,
      description: 'New invoice created',
      icon: FileText,
      color: 'green'
    })),
    ...transfers.map(transfer => ({
      type: 'transfer',
      timestamp: transfer.timestamp,
      title: `Transfer #${transfer.certificateId}`,
      description: transfer.isComplete ? 'Ownership transferred' : 'Transfer initiated',
      icon: ArrowRight,
      color: transfer.isComplete ? 'purple' : 'yellow'
    }))
  ].sort((a, b) => Number(a.timestamp) - Number(b.timestamp))

  return (
    <div className="space-y-4">
      {events.map((event, index) => {
        const Icon = event.icon
        return (
          <div key={index} className="flex items-start gap-4">
            <div className={`p-2 rounded-full bg-${event.color}-100 border-2 border-${event.color}-200`}>
              <Icon className={`h-4 w-4 text-${event.color}-600`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-slate-900">{event.title}</h4>
                <span className="text-sm text-slate-500">
                  {formatTimestamp(event.timestamp)}
                </span>
              </div>
              <p className="text-sm text-slate-600">{event.description}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Enhanced Product Information Component
function ProductInfo({ product }: { product: Product }) {
  const formatTimestamp = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleString()
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/20 rounded-lg">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Product #{product.productId.toString()}</h2>
            <p className="text-blue-100">Blockchain-verified product information</p>
          </div>
        </div>
      </div>
      
      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <Label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Product ID
              </Label>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {product.productId.toString()}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Registration Date
              </Label>
              <div className="text-lg text-slate-900 mt-1">
                {formatTimestamp(product.registrationTimestamp)}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Status
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Registered & Active
                </Badge>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <Label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <User className="h-4 w-4" />
                Initial Owner
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="bg-slate-100 px-3 py-2 rounded-lg font-mono text-sm flex-1">
                  {formatAddress(product.initialOwner)}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(product.initialOwner)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <User className="h-4 w-4" />
                Current Owner
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="bg-slate-100 px-3 py-2 rounded-lg font-mono text-sm flex-1">
                  {formatAddress(product.currentOwner)}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(product.currentOwner)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
                {product.currentOwner === product.initialOwner && (
                  <Badge variant="secondary">Original</Badge>
                )}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Metadata Hash
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="bg-slate-100 px-3 py-2 rounded-lg font-mono text-xs flex-1 break-all">
                  {product.metadataHash}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(product.metadataHash)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Enhanced Invoices Section Component
function InvoicesSection({ invoices }: { invoices: Invoice[] }) {
  const formatTimestamp = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleString()
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  if (invoices.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No Invoices Found</h3>
          <p className="text-slate-600 mb-6">
            This product doesn't have any invoices yet.
          </p>
          <Button variant="outline">
            Create First Invoice
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Invoice History</h3>
          <p className="text-sm text-slate-600">
            {invoices.length} invoice{invoices.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      <div className="grid gap-4">
        {invoices.map((invoice, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">Invoice #{invoice.invoiceId.toString()}</h4>
                    <p className="text-sm text-slate-600">
                      Created {formatTimestamp(invoice.timestamp)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {invoice.isTransferComplete ? (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Transfer Complete
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending Transfer
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                <div>
                  <Label className="text-sm font-medium text-slate-600">Seller</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4 text-slate-400" />
                    <code className="text-sm">{formatAddress(invoice.seller)}</code>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-600">Buyer</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4 text-slate-400" />
                    <code className="text-sm">{formatAddress(invoice.buyer)}</code>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-xs text-slate-500 font-mono">
                  Hash: {invoice.invoiceHash.slice(0, 20)}...
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href={invoice.lighthouseURI} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-2" />
                    View PDF
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// Enhanced Transfers Section Component
function TransfersSection({ transfers }: { transfers: TransferCertificate[] }) {
  const formatTimestamp = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleString()
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  if (transfers.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <History className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No Transfers Found</h3>
          <p className="text-slate-600 mb-6">
            This product hasn't been transferred yet.
          </p>
          <Button variant="outline">
            Initiate Transfer
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Transfer History</h3>
          <p className="text-sm text-slate-600">
            {transfers.length} transfer{transfers.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      <div className="grid gap-4">
        {transfers.map((transfer, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <History className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">Certificate #{transfer.certificateId.toString()}</h4>
                    <p className="text-sm text-slate-600">
                      Created {formatTimestamp(transfer.timestamp)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {transfer.isComplete ? (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Complete
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending Signatures
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-slate-600">Seller</Label>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-400" />
                        <code className="text-sm">{formatAddress(transfer.seller)}</code>
                      </div>
                      <div className="flex items-center gap-1">
                        {transfer.sellerSigned ? (
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
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-slate-600">Buyer</Label>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-400" />
                        <code className="text-sm">{formatAddress(transfer.buyer)}</code>
                      </div>
                      <div className="flex items-center gap-1">
                        {transfer.buyerSigned ? (
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
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-600">Signature Progress</span>
                  <span className="font-medium">
                    {(transfer.sellerSigned ? 1 : 0) + (transfer.buyerSigned ? 1 : 0)}/2
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${((transfer.sellerSigned ? 1 : 0) + (transfer.buyerSigned ? 1 : 0)) * 50}%` 
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600 mb-4">
                <div>
                  <Label className="text-slate-600">Related Invoice</Label>
                  <div className="font-medium">#{transfer.invoiceId.toString()}</div>
                </div>
                <div>
                  <Label className="text-slate-600">Product ID</Label>
                  <div className="font-medium">#{transfer.productId.toString()}</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-xs text-slate-500 font-mono">
                  Hash: {transfer.certificateHash.slice(0, 20)}...
                </div>
                <div className="flex gap-2">
                  {!transfer.isComplete && (
                    <Button variant="outline" size="sm">
                      <Timer className="h-3 w-3 mr-2" />
                      Track Progress
                    </Button>
                  )}
                  <Button variant="outline" size="sm" asChild>
                    <a href={transfer.lighthouseURI} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3 mr-2" />
                      View Certificate
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
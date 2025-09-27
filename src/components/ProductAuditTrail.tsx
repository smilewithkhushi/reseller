// components/ProductAuditTrail.tsx
'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { useReadContract } from 'wagmi'

import { CONTRACT_ABI, CONTRACT_ADDRESS } from '@/config/contract'
import {
    AlertCircle,
    Calendar,
    CheckCircle,
    Clock,
    ExternalLink,
    FileText,
    Hash,
    Package,
    Search,
    User
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
  }

  const formatTimestamp = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleString()
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const isLoading = productLoading || invoicesLoading || transfersLoading

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Product
          </CardTitle>
          <CardDescription>
            Enter a product ID to view its complete audit trail
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="searchProductId">Product ID</Label>
              <Input
                id="searchProductId"
                type="number"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                placeholder="Enter product ID"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearch} disabled={!productId || isLoading}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {searchInitiated && (
        <>
          {/* Product Information */}
          {productError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Product not found. Please check the product ID and try again.
              </AlertDescription>
            </Alert>
          ) : productData ? (
            <ProductInfo product={productData as Product} />
          ) : null}

          {/* Invoices Section */}
          {invoicesData && (
            <InvoicesSection invoices={invoicesData as Invoice[]} />
          )}

          {/* Transfers Section */}
          {transfersData && (
            <TransfersSection transfers={transfersData as TransferCertificate[]} />
          )}
        </>
      )}
    </div>
  )
}

// Product Information Component
function ProductInfo({ product }: { product: Product }) {
  const formatTimestamp = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleString()
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Product Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-slate-600">Product ID</Label>
              <div className="text-lg font-semibold">{product.productId.toString()}</div>
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-600">Registration Date</Label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-500" />
                {formatTimestamp(product.registrationTimestamp)}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-600">Metadata Hash</Label>
              <div className="flex items-center gap-2 font-mono text-sm bg-slate-100 p-2 rounded">
                <Hash className="h-4 w-4 text-slate-500" />
                {product.metadataHash}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-slate-600">Initial Owner</Label>
              <div className="flex items-center gap-2 font-mono">
                <User className="h-4 w-4 text-slate-500" />
                {formatAddress(product.initialOwner)}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-600">Current Owner</Label>
              <div className="flex items-center gap-2 font-mono">
                <User className="h-4 w-4 text-blue-500" />
                {formatAddress(product.currentOwner)}
                {product.currentOwner === product.initialOwner && (
                  <span className="text-sm text-slate-500">(Original)</span>
                )}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-600">Status</Label>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-green-600 font-medium">Registered</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Invoices Section Component
function InvoicesSection({ invoices }: { invoices: Invoice[] }) {
  const formatTimestamp = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleString()
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  if (invoices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Invoices ({invoices.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-slate-500 py-8">
            No invoices found for this product
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Invoices ({invoices.length})
        </CardTitle>
        <CardDescription>
          All invoices created for this product
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {invoices.map((invoice, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">Invoice #{invoice.invoiceId.toString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  {invoice.isTransferComplete ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600">Transfer Complete</span>
                    </>
                  ) : (
                    <>
                      <Clock className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm text-yellow-600">Pending Transfer</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <Label className="text-slate-600">Seller</Label>
                  <div className="font-mono">{formatAddress(invoice.seller)}</div>
                </div>
                <div>
                  <Label className="text-slate-600">Buyer</Label>
                  <div className="font-mono">{formatAddress(invoice.buyer)}</div>
                </div>
                <div>
                  <Label className="text-slate-600">Created</Label>
                  <div>{formatTimestamp(invoice.timestamp)}</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="text-xs text-slate-500 font-mono">
                  Hash: {invoice.invoiceHash}
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href={invoice.lighthouseURI} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View PDF
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Transfers Section Component
function TransfersSection({ transfers }: { transfers: TransferCertificate[] }) {
  const formatTimestamp = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleString()
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  if (transfers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Transfer Certificates ({transfers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-slate-500 py-8">
            No transfer certificates found for this product
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Transfer Certificates ({transfers.length})
        </CardTitle>
        <CardDescription>
          All ownership transfer certificates for this product
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transfers.map((transfer, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-purple-500" />
                  <span className="font-medium">Certificate #{transfer.certificateId.toString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  {transfer.isComplete ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600">Complete</span>
                    </>
                  ) : (
                    <>
                      <Clock className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm text-yellow-600">Pending Signatures</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div>
                    <Label className="text-slate-600">Seller</Label>
                    <div className="font-mono text-sm">{formatAddress(transfer.seller)}</div>
                    <div className="flex items-center gap-1 mt-1">
                      {transfer.sellerSigned ? (
                        <>
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span className="text-xs text-green-600">Signed</span>
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3 text-yellow-500" />
                          <span className="text-xs text-yellow-600">Pending</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <Label className="text-slate-600">Buyer</Label>
                    <div className="font-mono text-sm">{formatAddress(transfer.buyer)}</div>
                    <div className="flex items-center gap-1 mt-1">
                      {transfer.buyerSigned ? (
                        <>
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span className="text-xs text-green-600">Signed</span>
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3 text-yellow-500" />
                          <span className="text-xs text-yellow-600">Pending</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-sm text-slate-600">
                <Label>Created:</Label> {formatTimestamp(transfer.timestamp)}
                <span className="ml-4">
                  <Label>Invoice ID:</Label> {transfer.invoiceId.toString()}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="text-xs text-slate-500 font-mono">
                  Hash: {transfer.certificateHash}
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href={transfer.lighthouseURI} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View Certificate
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
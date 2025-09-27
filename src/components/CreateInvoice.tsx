// components/CreateInvoice.tsx
'use client'

import { useState } from 'react'
import { useContractWrite, useTransactionReceipt, useContractRead } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/config/contract'
import { FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import jsPDF from 'jspdf'
import { toast } from 'sonner'

interface InvoiceData {
  productId: string
  buyerAddress: string
  amount: string
  currency: string
  description: string
  paymentTerms: string
  dueDate: string
}

interface Product {
  productId: bigint
  initialOwner: string
  currentOwner: string
  registrationTimestamp: bigint
  metadataHash: string
  isRegistered: boolean
}

export function CreateInvoice() {
  const [formData, setFormData] = useState<InvoiceData>({
    productId: '',
    buyerAddress: '',
    amount: '',
    currency: 'ETH',
    description: '',
    paymentTerms: 'Net 30',
    dueDate: ''
  })
  const [isUploading, setIsUploading] = useState(false)

  // Get product info
  const { data: productData, isError: productError } = useContractRead({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'getProduct',
    args: formData.productId ? [BigInt(formData.productId)] : undefined,
    enabled: !!formData.productId,
  })

  // Contract interaction
  const { data, write, isLoading: isWriting } = useContractWrite({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'createInvoice',
  })

  const { isLoading: isConfirming, isSuccess } = useTransactionReceipt({
    hash: data?.hash,
  })

  const generateInvoicePDF = (invoiceData: InvoiceData, invoiceId: string): Uint8Array => {
    const doc = new jsPDF()
    
    // Header
    doc.setFontSize(20)
    doc.text('INVOICE', 20, 30)
    
    // Invoice details
    doc.setFontSize(12)
    doc.text(`Invoice ID: ${invoiceId}`, 20, 50)
    doc.text(`Product ID: ${invoiceData.productId}`, 20, 60)
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 70)
    doc.text(`Due Date: ${invoiceData.dueDate}`, 20, 80)
    
    // Buyer info
    doc.text('Bill To:', 20, 100)
    doc.text(`Address: ${invoiceData.buyerAddress}`, 20, 110)
    
    // Invoice items
    doc.text('Description:', 20, 130)
    doc.text(invoiceData.description || 'Product sale', 20, 140)
    
    doc.text(`Amount: ${invoiceData.amount} ${invoiceData.currency}`, 20, 160)
    doc.text(`Payment Terms: ${invoiceData.paymentTerms}`, 20, 170)
    
    // Footer
    doc.text('This invoice is recorded on the blockchain for authenticity.', 20, 200)
    
    return doc.output('arraybuffer') as Uint8Array
  }

  const uploadToLighthouse = async (pdfBuffer: Uint8Array): Promise<string> => {
    // Mock implementation - replace with actual Lighthouse integration
    await new Promise(resolve => setTimeout(resolve, 1500))
    const hash = 'Qm' + Math.random().toString(36).substring(2, 15)
    return `https://gateway.lighthouse.storage/ipfs/${hash}`
  }

  const handleInputChange = (field: keyof InvoiceData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.productId || !formData.buyerAddress || !formData.amount) {
      toast.error("Validation Error", {
        description: "Please fill in all required fields",
      })
      return
    }

    if (!productData || productError) {
      toast.error("Invalid Product", {
        title: "Invalid Product",
        description: "Product ID not found or invalid",

      })
      return
    }

    try {
      setIsUploading(true)
      
      // Generate invoice ID
      const invoiceId = `INV-${Date.now()}`
      
      // Generate PDF
      const pdfBuffer = generateInvoicePDF(formData, invoiceId)
      
      // Upload to Lighthouse
      const lighthouseURI = await uploadToLighthouse(pdfBuffer)
      
      // Create invoice hash
      const invoiceHash = btoa(JSON.stringify(formData)).slice(0, 32)
      
      // Create invoice on blockchain
      write({
        args: [
          BigInt(formData.productId),
          formData.buyerAddress as `0x${string}`,
          invoiceHash,
          lighthouseURI
        ]
      })
      
      toast.success("Invoice Creation Initiated", {
        description: "Invoice transaction sent to blockchain",
      })
      
    } catch (error) {
      console.error('Invoice creation error:', error)
      toast.error("Creation Failed", {
        description: "Failed to create invoice. Please try again.",
      })
    } finally {
      setIsUploading(false)
    }
  }

  // Reset form after successful creation
  if (isSuccess) {
    setTimeout(() => {
      setFormData({
        productId: '',
        buyerAddress: '',
        amount: '',
        currency: 'ETH',
        description: '',
        paymentTerms: 'Net 30',
        dueDate: ''
      })
      toast.success("Success!", {
        description: "Invoice created successfully on the blockchain",
      })
    }, 2000)
  }

  const isLoading = isUploading || isWriting || isConfirming

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="productId">Product ID *</Label>
          <Input
            id="productId"
            type="number"
            value={formData.productId}
            onChange={(e) => handleInputChange('productId', e.target.value)}
            placeholder="Enter product ID"
            required
          />
          {productData && (
            <div className="text-sm text-green-600 flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              Product found - Owner: {(productData as any).currentOwner.slice(0, 8)}...
            </div>
          )}
          {productError && formData.productId && (
            <div className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              Product not found
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="buyerAddress">Buyer Address *</Label>
          <Input
            id="buyerAddress"
            value={formData.buyerAddress}
            onChange={(e) => handleInputChange('buyerAddress', e.target.value)}
            placeholder="0x..."
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Amount *</Label>
          <Input
            id="amount"
            type="number"
            step="0.0001"
            value={formData.amount}
            onChange={(e) => handleInputChange('amount', e.target.value)}
            placeholder="0.00"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <select
            id="currency"
            value={formData.currency}
            onChange={(e) => handleInputChange('currency', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ETH">ETH</option>
            <option value="USDC">USDC</option>
            <option value="USDT">USDT</option>
            <option value="USD">USD</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dueDate">Due Date</Label>
          <Input
            id="dueDate"
            type="date"
            value={formData.dueDate}
            onChange={(e) => handleInputChange('dueDate', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="paymentTerms">Payment Terms</Label>
          <select
            id="paymentTerms"
            value={formData.paymentTerms}
            onChange={(e) => handleInputChange('paymentTerms', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Due on receipt">Due on receipt</option>
            <option value="Net 15">Net 15</option>
            <option value="Net 30">Net 30</option>
            <option value="Net 60">Net 60</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Product sale description"
          rows={3}
        />
      </div>

      {isSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            Invoice created successfully! Transaction hash: {data?.hash?.slice(0, 10)}...
          </AlertDescription>
        </Alert>
      )}

      <Button 
        type="submit" 
        className="w-full"
        disabled={isLoading || !productData}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {isUploading ? 'Generating PDF...' : isWriting ? 'Confirming...' : 'Creating...'}
          </>
        ) : (
          <>
            <FileText className="mr-2 h-4 w-4" />
            Create Invoice
          </>
        )}
      </Button>
    </form>
  )
}
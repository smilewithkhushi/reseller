'use client'

import React, { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '@/config/contract'
import { 
  Package, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Hash,
  Building,
  Tag,
  Sparkles
} from 'lucide-react'
import { toast } from 'sonner'

interface ProductData {
  productName: string
  productDescription: string
  manufacturer: string
  serialNumber: string
  category: string
}

export default function RegisterProduct() {
  const { address, isConnected } = useAccount()
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const [productData, setProductData] = useState<ProductData>({
    productName: '',
    productDescription: '',
    manufacturer: '',
    serialNumber: '',
    category: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setProductData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isConnected) {
      toast.error("Please connect your wallet")
      return
    }

    if (!productData.productName || !productData.serialNumber) {
      toast.error("Please fill in required fields")
      return
    }

    try {
      const metadata = {
        ...productData,
        timestamp: Date.now(),
        registeredBy: address
      }

      writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: 'registerProduct',
        args: [JSON.stringify(metadata)]
      })

      toast.success("Product registration initiated!")
    } catch (error) {
      console.error('Registration error:', error)
      toast.error("Failed to register product")
    }
  }

  const isFormValid = productData.productName && productData.serialNumber && productData.manufacturer

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 opacity-50" />
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Package className="h-5 w-5 text-white" />
            </div>
            Register New Product
          </CardTitle>
          <CardDescription>
            Register a product on the blockchain for provenance tracking
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Form */}
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="productName" className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Product Name *
                </Label>
                <Input
                  id="productName"
                  name="productName"
                  value={productData.productName}
                  onChange={handleInputChange}
                  placeholder="Enter product name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serialNumber" className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Serial Number *
                </Label>
                <Input
                  id="serialNumber"
                  name="serialNumber"
                  value={productData.serialNumber}
                  onChange={handleInputChange}
                  placeholder="Unique serial number"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manufacturer" className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Manufacturer *
                </Label>
                <Input
                  id="manufacturer"
                  name="manufacturer"
                  value={productData.manufacturer}
                  onChange={handleInputChange}
                  placeholder="Company name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  name="category"
                  value={productData.category}
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select Category</option>
                  <option value="electronics">Electronics</option>
                  <option value="pharmaceuticals">Pharmaceuticals</option>
                  <option value="food">Food & Beverages</option>
                  <option value="cosmetics">Cosmetics</option>
                  <option value="automotive">Automotive</option>
                  <option value="textiles">Textiles</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="productDescription">Description</Label>
              <Textarea
                id="productDescription"
                name="productDescription"
                value={productData.productDescription}
                onChange={handleInputChange}
                placeholder="Product description and specifications"
                rows={3}
              />
            </div>

            {/* Status Messages */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Error: {error.message}
                </AlertDescription>
              </Alert>
            )}

            {hash && (
              <Alert className="border-blue-200 bg-blue-50">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-700">
                  Transaction submitted: {hash.slice(0, 20)}...
                  {isConfirming && <span className="ml-2">(Confirming...)</span>}
                  {isSuccess && <span className="ml-2 text-green-600">✓ Confirmed!</span>}
                </AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={!isFormValid || !isConnected || isPending || isConfirming}
              className="w-full h-12"
              size="lg"
            >
              {isPending || isConfirming ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {isPending ? 'Submitting...' : 'Confirming...'}
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Register Product
                </>
              )}
            </Button>

            {!isConnected && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please connect your wallet to register a product
                </AlertDescription>
              </Alert>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
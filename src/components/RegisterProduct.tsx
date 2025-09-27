// components/RegisterProduct.tsx
'use client'

import { useState } from 'react'
import { useContractWrite, useTransactionReceipt, useWriteContract } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/config/contract'
import { Upload, Loader2, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface ProductMetadata {
  name: string
  description: string
  category: string
  manufacturer: string
  model: string
  serialNumber: string
  images: string[]
}

export function RegisterProduct() {
  const [formData, setFormData] = useState<ProductMetadata>({
    name: '',
    description: '',
    category: '',
    manufacturer: '',
    model: '',
    serialNumber: '',
    images: []
  })
  const [isUploading, setIsUploading] = useState(false)
  // Contract interaction
  const { data, writeContract, isPending: isWriting } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useTransactionReceipt({
    hash: data,
  })

  const uploadToLighthouse = async (metadata: ProductMetadata): Promise<string> => {
    // Mock implementation - replace with actual Lighthouse integration
    const metadataJson = JSON.stringify(metadata, null, 2)
    const hash = btoa(metadataJson).slice(0, 46) // Mock IPFS hash
    
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    return `QmHash${hash}`
  }

  const handleInputChange = (field: keyof ProductMetadata, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.manufacturer || !formData.serialNumber) {
      toast.error("Validation Error", {
        description: "Please fill in all required fields",
      })
      return
    }

    try {
      setIsUploading(true)
      
      // Upload metadata to Lighthouse
      const metadataHash = await uploadToLighthouse(formData)
      
      // Register product on blockchain
      writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: 'registerProduct',
        args: [metadataHash]
      })
      
      toast.success("Registration Initiated", {
        description: "Product registration transaction sent to blockchain",
      })
      
    } catch (error) {
      console.error('Registration error:', error)
      toast.error("Registration Failed", {
        description: "Failed to register product. Please try again.",
      })
    } finally {
      setIsUploading(false)
    }
  }

  // Reset form after successful registration
  if (isSuccess) {
    setTimeout(() => {
      setFormData({
        name: '',
        description: '',
        category: '',
        manufacturer: '',
        model: '',
        serialNumber: '',
        images: []
      })
      toast.success("Success!", {
        description: "Product registered successfully on the blockchain",
      })
    }, 2000)
  }

  const isLoading = isUploading || isWriting || isConfirming

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">Product Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Enter product name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            value={formData.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
            placeholder="e.g., Electronics, Luxury Goods"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="manufacturer">Manufacturer *</Label>
          <Input
            id="manufacturer"
            value={formData.manufacturer}
            onChange={(e) => handleInputChange('manufacturer', e.target.value)}
            placeholder="Enter manufacturer name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Input
            id="model"
            value={formData.model}
            onChange={(e) => handleInputChange('model', e.target.value)}
            placeholder="Enter model number"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="serialNumber">Serial Number *</Label>
          <Input
            id="serialNumber"
            value={formData.serialNumber}
            onChange={(e) => handleInputChange('serialNumber', e.target.value)}
            placeholder="Enter unique serial number"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Detailed product description"
          rows={4}
        />
      </div>

      {isSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            Product registered successfully! Transaction hash: {data?.slice(0, 10)}...
          </AlertDescription>
        </Alert>
      )}

      <Button 
        type="submit" 
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {isUploading ? 'Uploading metadata...' : isWriting ? 'Confirming...' : 'Registering...'}
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Register Product
          </>
        )}
      </Button>
    </form>
  )
}
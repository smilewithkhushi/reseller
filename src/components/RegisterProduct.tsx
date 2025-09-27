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
import { Upload, Loader2, CheckCircle, X, FileText, Image } from 'lucide-react'
import { toast } from 'sonner'

interface ProductMetadata {
  name: string
  description: string
  category: string
  manufacturer: string
  model: string
  serialNumber: string
  images: string[]
  verificationDocuments: string[]
}

export function RegisterProduct() {
  const [formData, setFormData] = useState<ProductMetadata>({
    name: '',
    description: '',
    category: '',
    manufacturer: '',
    model: '',
    serialNumber: '',
    images: [],
    verificationDocuments: []
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

  const handleFileUpload = (field: 'images' | 'verificationDocuments', files: FileList | null) => {
    if (!files) return
    
    const fileArray = Array.from(files)
    const fileUrls = fileArray.map(file => URL.createObjectURL(file))
    
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], ...fileUrls]
    }))
  }

  const removeFile = (field: 'images' | 'verificationDocuments', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
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
        images: [],
        verificationDocuments: []
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
          <select
            id="category"
            value={formData.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            <option value="">Select a category</option>
            <option value="Electronics">Electronics</option>
            <option value="Vehicles">Vehicles</option>
            <option value="Luxury Goods">Luxury Goods</option>
            <option value="Apparel">Apparel</option>
            <option value="Jewelry">Jewelry</option>
            <option value="Collectibles">Collectibles</option>
            <option value="Art">Art</option>
            <option value="Other">Other</option>
          </select>
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

      {/* Product Images Upload */}
      <div className="space-y-2">
        <Label htmlFor="images">Product Images</Label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <div className="text-center">
            <Image className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor="images" className="cursor-pointer">
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  Upload product images
                </span>
                <span className="mt-1 block text-sm text-gray-500">
                  PNG, JPG, GIF up to 10MB each
                </span>
                <input
                  id="images"
                  name="images"
                  type="file"
                  multiple
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => handleFileUpload('images', e.target.files)}
                />
              </label>
            </div>
          </div>
        </div>
        
        {/* Display uploaded images */}
        {formData.images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {formData.images.map((imageUrl, index) => (
              <div key={index} className="relative">
                <img
                  src={imageUrl}
                  alt={`Product ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg border"
                />
                <button
                  type="button"
                  onClick={() => removeFile('images', index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Verification Documents Upload */}
      <div className="space-y-2">
        <Label htmlFor="verificationDocuments">Verification Documents</Label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <div className="text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor="verificationDocuments" className="cursor-pointer">
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  Upload verification documents
                </span>
                <span className="mt-1 block text-sm text-gray-500">
                  PDF, DOC, DOCX files (invoices, certificates, etc.)
                </span>
                <input
                  id="verificationDocuments"
                  name="verificationDocuments"
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx"
                  className="sr-only"
                  onChange={(e) => handleFileUpload('verificationDocuments', e.target.files)}
                />
              </label>
            </div>
          </div>
        </div>
        
        {/* Display uploaded documents */}
        {formData.verificationDocuments.length > 0 && (
          <div className="space-y-2 mt-4">
            {formData.verificationDocuments.map((docUrl, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-gray-500" />
                  <span className="text-sm text-gray-700">
                    Document {index + 1}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile('verificationDocuments', index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
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
'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import lighthouse from '@lighthouse-web3/sdk'
import { 
  Camera, 
  Upload, 
  FileText, 
  Image, 
  AlertCircle, 
  CheckCircle, 
  Loader2, 
  X,
  Package,
  Calendar,
  DollarSign,
  Hash,
  Building,
  Tag,
  Info,
  Plus,
  Eye,
  Download,
  Cloud,
  Shield,
  Sparkles
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Types
interface AssetImage {
  file: File
  preview: string
  name: string
  id: string
}

interface LighthouseUploadResponse {
  data: {
    Name: string
    Hash: string
    Size: string
  }
}

interface StorageProof {
  cid: string
  name: string
  size: string
  timestamp: number
  dealStatus?: string
}

interface InvoiceData {
  productName: string
  productDescription: string
  manufacturer: string
  batchNumber: string
  manufacturingDate: string
  expiryDate: string
  category: string
  price: string
  quantity: string
  serialNumber: string
  assetImages: AssetImage[]
  invoicePdf: File | null
}

interface CreateInvoiceProps {
  contractAddress: string
  abi: any[]
}

export default function CreateInvoice({ contractAddress, abi }: CreateInvoiceProps) {
  // Wagmi hooks
  const { address, isConnected } = useAccount()
  const { writeContract, data: hash, isPending: isWritePending, error: writeError } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  // Component state
  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    productName: '',
    productDescription: '',
    manufacturer: '',
    batchNumber: '',
    manufacturingDate: '',
    expiryDate: '',
    category: '',
    price: '',
    quantity: '1',
    serialNumber: '',
    assetImages: [],
    invoicePdf: null,
  })

  // Lighthouse storage state
  const [lighthouseApiKey, setLighthouseApiKey] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [storageProofs, setStorageProofs] = useState<StorageProof[]>([])
  const [uploadErrors, setUploadErrors] = useState<string[]>([])
  const [isRegistering, setIsRegistering] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')

  // Refs
  const imageInputRef = useRef<HTMLInputElement>(null)
  const pdfInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  // Load Lighthouse API key from environment
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_LIGHTHOUSE_API_KEY
    if (apiKey) {
      setLighthouseApiKey(apiKey)
    }
  }, [])

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setInvoiceData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newImages: AssetImage[] = []
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const preview = URL.createObjectURL(file)
        newImages.push({
          file,
          preview,
          name: file.name,
          id: Math.random().toString(36).substr(2, 9)
        })
      }
    })

    setInvoiceData(prev => ({
      ...prev,
      assetImages: [...prev.assetImages, ...newImages]
    }))
  }

  // Handle camera capture
  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const preview = URL.createObjectURL(file)
    const newImage: AssetImage = {
      file,
      preview,
      name: `camera-${Date.now()}.jpg`,
      id: Math.random().toString(36).substr(2, 9)
    }

    setInvoiceData(prev => ({
      ...prev,
      assetImages: [...prev.assetImages, newImage]
    }))
  }

  // Handle PDF selection
  const handlePdfSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      setInvoiceData(prev => ({
        ...prev,
        invoicePdf: file
      }))
    }
  }

  // Remove image
  const removeImage = (id: string) => {
    setInvoiceData(prev => ({
      ...prev,
      assetImages: prev.assetImages.filter(img => img.id !== id)
    }))
  }

  // Remove PDF
  const removePdf = () => {
    setInvoiceData(prev => ({
      ...prev,
      invoicePdf: null
    }))
  }

  // Upload file to Lighthouse
  const uploadToLighthouse = async (file: File, filename: string): Promise<LighthouseUploadResponse> => {
    if (!lighthouseApiKey) {
      throw new Error('Lighthouse API key is not configured')
    }

    try {
      const tempFile = new File([file], filename, { type: file.type })
      const progressCallback = (progressData: any) => {
        // Handle progress updates
      }

      const uploadResponse = await lighthouse.upload([tempFile], lighthouseApiKey, undefined, progressCallback)
      console.log('File Status:', uploadResponse)
      console.log('Visit at https://gateway.lighthouse.storage/ipfs/' + uploadResponse.data.Hash)

      return uploadResponse as LighthouseUploadResponse
    } catch (error) {
      console.error(`Error uploading ${filename}:`, error)
      throw error
    }
  }

  // Upload all files to Lighthouse
  const uploadAllFiles = async (): Promise<StorageProof[]> => {
    if (!lighthouseApiKey) {
      throw new Error('Lighthouse API key is not configured')
    }

    setIsUploading(true)
    setUploadErrors([])
    const proofs: StorageProof[] = []

    try {
      // Upload asset images
      for (let i = 0; i < invoiceData.assetImages.length; i++) {
        const image = invoiceData.assetImages[i]
        try {
          const filename = `asset_${i + 1}_${image.name}`
          const uploadResponse = await uploadToLighthouse(image.file, filename)
          
          proofs.push({
            cid: uploadResponse.data.Hash,
            name: filename,
            size: uploadResponse.data.Size,
            timestamp: Date.now()
          })
        } catch (error) {
          const errorMsg = `Failed to upload ${image.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
          setUploadErrors(prev => [...prev, errorMsg])
        }
      }

      // Upload invoice PDF
      if (invoiceData.invoicePdf) {
        try {
          const filename = `invoice_${invoiceData.serialNumber || Date.now()}.pdf`
          const uploadResponse = await uploadToLighthouse(invoiceData.invoicePdf, filename)
          
          proofs.push({
            cid: uploadResponse.data.Hash,
            name: filename,
            size: uploadResponse.data.Size,
            timestamp: Date.now()
          })
        } catch (error) {
          const errorMsg = `Failed to upload invoice PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
          setUploadErrors(prev => [...prev, errorMsg])
        }
      }

      setStorageProofs(proofs)
      return proofs
    } finally {
      setIsUploading(false)
      setUploadProgress({})
    }
  }

  // Register product with blockchain
  const registerProduct = async () => {
    if (!isConnected || !address) {
      return
    }

    if (!lighthouseApiKey) {
      setUploadErrors(['Lighthouse API key is not configured. Please check your environment variables.'])
      return
    }

    if (invoiceData.assetImages.length === 0 && !invoiceData.invoicePdf) {
      setUploadErrors(['Please add at least one asset image or invoice PDF'])
      return
    }

    setIsRegistering(true)

    try {
      // First upload all files to Lighthouse
      const proofs = await uploadAllFiles()
      
      if (proofs.length === 0) {
        throw new Error('No files were successfully uploaded to Lighthouse')
      }

      // Prepare data for blockchain
      const imageCIDs = proofs
        .filter(proof => proof.name.startsWith('asset_'))
        .map(proof => proof.cid)
      
      const invoiceCID = proofs
        .find(proof => proof.name.includes('invoice_'))?.cid || ''

      const metadata = {
        productName: invoiceData.productName,
        description: invoiceData.productDescription,
        manufacturer: invoiceData.manufacturer,
        batchNumber: invoiceData.batchNumber,
        manufacturingDate: invoiceData.manufacturingDate,
        expiryDate: invoiceData.expiryDate,
        category: invoiceData.category,
        price: invoiceData.price,
        quantity: parseInt(invoiceData.quantity) || 1,
        serialNumber: invoiceData.serialNumber,
        assetImageCIDs: imageCIDs,
        invoiceCID: invoiceCID,
        timestamp: Date.now(),
        storageProofs: proofs
      }

      // Write to smart contract
      writeContract({
        address: contractAddress as `0x${string}`,
        abi,
        functionName: 'createInvoice',
        args: [JSON.stringify(metadata)]
      })

    } catch (error) {
      console.error('Error registering product:', error)
      setUploadErrors([error instanceof Error ? error.message : 'Failed to register product'])
    } finally {
      setIsRegistering(false)
    }
  }

  const isFormValid = invoiceData.productName && invoiceData.serialNumber && 
                     (invoiceData.assetImages.length > 0 || invoiceData.invoicePdf)

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-50 to-emerald-50 opacity-50" />
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <div className="p-2 bg-green-500 rounded-lg">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                Create Product Invoice
              </CardTitle>
              <CardDescription className="mt-2">
                Register a new product with decentralized storage and blockchain verification
              </CardDescription>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600">
              <Shield className="h-4 w-4" />
              Blockchain Secured
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* API Key Status */}
      {!lighthouseApiKey && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Lighthouse API key is not configured. Please set NEXT_PUBLIC_LIGHTHOUSE_API_KEY in your environment variables.
          </AlertDescription>
        </Alert>
      )}

      {/* Form Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Basic Info
          </TabsTrigger>
          <TabsTrigger value="details" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Details
          </TabsTrigger>
          <TabsTrigger value="media" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            Media
            {(invoiceData.assetImages.length > 0 || invoiceData.invoicePdf) && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                {invoiceData.assetImages.length + (invoiceData.invoicePdf ? 1 : 0)}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="review" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Review
          </TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Basic Product Information
              </CardTitle>
              <CardDescription>
                Enter the essential product details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="productName" className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Product Name *
                  </Label>
                  <Input
                    id="productName"
                    name="productName"
                    value={invoiceData.productName}
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
                    value={invoiceData.serialNumber}
                    onChange={handleInputChange}
                    placeholder="Enter unique serial number"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manufacturer" className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Manufacturer/Retailer *
                  </Label>
                  <Input
                    id="manufacturer"
                    name="manufacturer"
                    value={invoiceData.manufacturer}
                    onChange={handleInputChange}
                    placeholder="Company or manufacturer name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category" className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Category
                  </Label>
                  <select
                    id="category"
                    name="category"
                    value={invoiceData.category}
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
                <Label htmlFor="productDescription">Product Description</Label>
                <Textarea
                  id="productDescription"
                  name="productDescription"
                  value={invoiceData.productDescription}
                  onChange={handleInputChange}
                  placeholder="Describe the product features, specifications, etc."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Product Details
              </CardTitle>
              <CardDescription>
                Additional product information and specifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="batchNumber">Batch Number</Label>
                  <Input
                    id="batchNumber"
                    name="batchNumber"
                    value={invoiceData.batchNumber}
                    onChange={handleInputChange}
                    placeholder="Batch or lot number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min="1"
                    value={invoiceData.quantity}
                    onChange={handleInputChange}
                    placeholder="Product quantity"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Price
                  </Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    value={invoiceData.price}
                    onChange={handleInputChange}
                    placeholder="Product price"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manufacturingDate" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Manufacturing Date
                  </Label>
                  <Input
                    id="manufacturingDate"
                    name="manufacturingDate"
                    type="date"
                    value={invoiceData.manufacturingDate}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiryDate" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Expiry Date
                  </Label>
                  <Input
                    id="expiryDate"
                    name="expiryDate"
                    type="date"
                    value={invoiceData.expiryDate}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Media Tab */}
        <TabsContent value="media" className="space-y-6">
          {/* Asset Images Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Product Images
              </CardTitle>
              <CardDescription>
                Upload photos of your product for verification and documentation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Upload Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => imageInputRef.current?.click()}
                  className="h-24 border-dashed border-2 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="text-center">
                    <Upload className="h-6 w-6 mx-auto mb-2 text-slate-400" />
                    <span className="text-sm font-medium">Upload Images</span>
                    <p className="text-xs text-slate-500">JPG, PNG up to 10MB</p>
                  </div>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => cameraInputRef.current?.click()}
                  className="h-24 border-dashed border-2 hover:border-green-300 hover:bg-green-50 transition-colors"
                >
                  <div className="text-center">
                    <Camera className="h-6 w-6 mx-auto mb-2 text-slate-400" />
                    <span className="text-sm font-medium">Take Photo</span>
                    <p className="text-xs text-slate-500">Use device camera</p>
                  </div>
                </Button>
              </div>

              {/* Hidden Inputs */}
              <input
                ref={imageInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleCameraCapture}
                className="hidden"
              />

              {/* Image Preview Grid */}
              {invoiceData.assetImages.length > 0 && (
                <div>
                  <Label className="mb-3 block">Uploaded Images ({invoiceData.assetImages.length})</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {invoiceData.assetImages.map((image) => (
                      <div key={image.id} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden border-2 border-slate-200 hover:border-blue-300 transition-colors">
                          <img
                            src={image.preview}
                            alt={image.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeImage(image.id)}
                          className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                        <p className="text-xs text-slate-600 mt-1 truncate">{image.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoice PDF Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Invoice PDF
              </CardTitle>
              <CardDescription>
                Upload the official invoice document
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!invoiceData.invoicePdf ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => pdfInputRef.current?.click()}
                  className="w-full h-24 border-dashed border-2 hover:border-purple-300 hover:bg-purple-50 transition-colors"
                >
                  <div className="text-center">
                    <FileText className="h-6 w-6 mx-auto mb-2 text-slate-400" />
                    <span className="text-sm font-medium">Upload PDF Invoice</span>
                    <p className="text-xs text-slate-500">PDF files up to 25MB</p>
                  </div>
                </Button>
              ) : (
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <FileText className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium">{invoiceData.invoicePdf.name}</p>
                      <p className="text-sm text-slate-600">
                        {(invoiceData.invoicePdf.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => pdfInputRef.current?.click()}
                    >
                      Replace
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={removePdf}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}

              <input
                ref={pdfInputRef}
                type="file"
                accept=".pdf"
                onChange={handlePdfSelect}
                className="hidden"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Review Tab */}
        <TabsContent value="review" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Review & Submit
              </CardTitle>
              <CardDescription>
                Review your product information before submitting to the blockchain
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-700">Product Info</p>
                        <p className="text-lg font-bold text-blue-900">
                          {invoiceData.productName || 'Not set'}
                        </p>
                        <p className="text-sm text-blue-600">
                          #{invoiceData.serialNumber || 'No serial'}
                        </p>
                      </div>
                      <Package className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-700">Media Files</p>
                        <p className="text-lg font-bold text-green-900">
                          {invoiceData.assetImages.length + (invoiceData.invoicePdf ? 1 : 0)}
                        </p>
                        <p className="text-sm text-green-600">
                          {invoiceData.assetImages.length} images, {invoiceData.invoicePdf ? 1 : 0} PDF
                        </p>
                      </div>
                      <Image className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-purple-700">Price</p>
                        <p className="text-lg font-bold text-purple-900">
                          ${invoiceData.price || '0.00'}
                        </p>
                        <p className="text-sm text-purple-600">
                          Qty: {invoiceData.quantity || 1}
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Validation Checklist */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Validation Checklist</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      {invoiceData.productName ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span className={invoiceData.productName ? 'text-green-700' : 'text-red-700'}>
                        Product name provided
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {invoiceData.serialNumber ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span className={invoiceData.serialNumber ? 'text-green-700' : 'text-red-700'}>
                        Serial number provided
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {(invoiceData.assetImages.length > 0 || invoiceData.invoicePdf) ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span className={(invoiceData.assetImages.length > 0 || invoiceData.invoicePdf) ? 'text-green-700' : 'text-red-700'}>
                        Media files uploaded
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {lighthouseApiKey ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span className={lighthouseApiKey ? 'text-green-700' : 'text-red-700'}>
                        Storage configuration ready
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {isConnected ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span className={isConnected ? 'text-green-700' : 'text-red-700'}>
                        Wallet connected
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Submit Section */}
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-2 text-green-700">
                      <Sparkles className="h-5 w-5" />
                      <span className="font-medium">Ready to register on blockchain</span>
                    </div>
                    
                    <Button
                      onClick={registerProduct}
                      disabled={!isFormValid || !isConnected || isRegistering || isUploading || isWritePending || isConfirming}
                      className="w-full h-12 text-lg"
                      size="lg"
                    >
                      {(isRegistering || isUploading) ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          {isUploading ? 'Uploading to Lighthouse...' : 'Uploading & Registering...'}
                        </>
                      ) : isWritePending ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Confirming Transaction...
                        </>
                      ) : isConfirming ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Transaction Confirming...
                        </>
                      ) : (
                        <>
                          <Cloud className="h-5 w-5 mr-2" />
                          Register Product on Blockchain
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

                    {!isFormValid && isConnected && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Please complete all required fields and upload at least one file
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upload Progress */}
      {isUploading && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5" />
              Uploading to Lighthouse Storage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(uploadProgress).map(([filename, progress]) => (
              <div key={filename} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{filename}</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Storage Proofs */}
      {storageProofs.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              Storage Proofs
            </CardTitle>
            <CardDescription>
              Files successfully uploaded to decentralized storage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {storageProofs.map((proof, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-green-900">{proof.name}</p>
                      <p className="text-sm text-green-700">CID: {proof.cid.slice(0, 20)}...</p>
                      <p className="text-xs text-green-600">Size: {proof.size} bytes</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="border-green-300 text-green-700 hover:bg-green-100"
                    >
                      <a
                        href={`https://gateway.lighthouse.storage/ipfs/${proof.cid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Messages */}
      {uploadErrors.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              Upload Errors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {uploadErrors.map((error, index) => (
                <Alert key={index} variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction Status */}
      {writeError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Transaction Error: {writeError.message}
          </AlertDescription>
        </Alert>
      )}

      {hash && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-blue-900">Transaction Submitted</p>
                <p className="text-sm text-blue-700 font-mono">{hash}</p>
                {isConfirming && (
                  <p className="text-sm text-blue-600">Confirming on blockchain...</p>
                )}
                {isConfirmed && (
                  <p className="text-sm text-green-600 font-medium">✓ Confirmed!</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
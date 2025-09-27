// components/CreateInvoice.tsx
'use client'

import React, { useState, useRef } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import lighthouse from '@lighthouse-web3/sdk'
import { Camera, Upload, FileText, Image, AlertCircle, CheckCircle, Loader2, X } from 'lucide-react'

// Types
interface AssetImage {
  file: File
  preview: string
  name: string
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
    quantity: '',
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

  // Refs
  const imageInputRef = useRef<HTMLInputElement>(null)
  const pdfInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

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
          name: file.name
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
      name: `camera-${Date.now()}.jpg`
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
  const removeImage = (index: number) => {
    setInvoiceData(prev => ({
      ...prev,
      assetImages: prev.assetImages.filter((_, i) => i !== index)
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
      throw new Error('Lighthouse API key is required')
    }

    try {
      // Create a temporary file path for the upload
      const tempFile = new File([file], filename, { type: file.type })
        // Define a dummy progress callback if not already defined
        const progressCallback = (progressData: any) => {
          // Optionally handle progress updates here but im not handling :) sorry
        };


        const uploadResponse = await lighthouse.upload([tempFile], lighthouseApiKey, undefined, progressCallback);
        console.log('File Status:', uploadResponse);

        console.log('Visit at https://gateway.lighthouse.storage/ipfs/' + uploadResponse.data.Hash);


      return uploadResponse as LighthouseUploadResponse
    } catch (error) {
      console.error(`Error uploading ${filename}:`, error)
      throw error
    }
  }

  // Upload all files to Lighthouse
  const uploadAllFiles = async (): Promise<StorageProof[]> => {
    if (!lighthouseApiKey) {
      throw new Error('Please enter your Lighthouse API key')
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
      alert('Please connect your wallet')
      return
    }

    if (!lighthouseApiKey) {
      alert('Please enter your Lighthouse API key')
      return
    }

    if (invoiceData.assetImages.length === 0 && !invoiceData.invoicePdf) {
      alert('Please add at least one asset image or invoice PDF')
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
        functionName: 'registerProduct',
        args: [
          invoiceData.serialNumber,
          JSON.stringify(metadata),
          imageCIDs,
          invoiceCID
        ],
      })

    } catch (error) {
      console.error('Error registering product:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to register product'}`)
    } finally {
      setIsRegistering(false)
    }
  }

  // Check deal status for uploaded files
  const checkDealStatus = async (cid: string) => {
    try {
      const dealStatus = await lighthouse.dealStatus(cid)
      return dealStatus
    } catch (error) {
      console.error('Error checking deal status:', error)
      return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Product Invoice</h2>

      {/* Lighthouse API Key Input */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <label className="block text-sm font-medium text-blue-900 mb-2">
          Lighthouse API Key
        </label>
        <input
          type="password"
          value={lighthouseApiKey}
          onChange={(e) => setLighthouseApiKey(e.target.value)}
          placeholder="Enter your Lighthouse API key for decentralized storage"
          className="w-full p-3 border border-blue-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="text-xs text-blue-600 mt-1">
          Get your API key from{' '}
          <a 
            href="https://files.lighthouse.storage/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="underline hover:text-blue-800"
          >
            Lighthouse Files Dashboard
          </a>
        </p>
      </div>

      <form className="space-y-6">
        {/* Basic Product Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Name *
            </label>
            <input
              type="text"
              name="productName"
              value={invoiceData.productName}
              onChange={handleInputChange}
              required
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Serial Number *
            </label>
            <input
              type="text"
              name="serialNumber"
              value={invoiceData.serialNumber}
              onChange={handleInputChange}
              required
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sold By/Manufactured by/Retailer
            </label>
            <input
              type="text"
              name="manufacturer"
              value={invoiceData.manufacturer}
              onChange={handleInputChange}
              required
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Batch Number
            </label>
            <input
              type="text"
              name="batchNumber"
              value={invoiceData.batchNumber}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              name="category"
              value={invoiceData.category}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price
            </label>
            <input
              type="number"
              step="0.01"
              name="price"
              value={invoiceData.price}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Manufacturing Date
            </label>
            <input
              type="date"
              name="manufacturingDate"
              value={invoiceData.manufacturingDate}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expiry Date
            </label>
            <input
              type="date"
              name="expiryDate"
              value={invoiceData.expiryDate}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Product Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Description
          </label>
          <textarea
            name="productDescription"
            value={invoiceData.productDescription}
            onChange={handleInputChange}
            rows={4}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Asset Images Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Asset Images</h3>
          
          {/* Image Upload Buttons */}
          <div className="flex flex-wrap gap-4 mb-4">
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Image size={20} />
              Upload Images
            </button>

            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Camera size={20} />
              Take Photo
            </button>
          </div>

          {/* Hidden Input Elements */}
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {invoiceData.assetImages.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image.preview}
                    alt={`Asset ${index + 1}`}
                    className="w-full h-32 object-cover rounded-md border"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={16} />
                  </button>
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 text-xs rounded">
                    {image.name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Invoice PDF Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice PDF</h3>
          
          <button
            type="button"
            onClick={() => pdfInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors mb-4"
          >
            <FileText size={20} />
            Upload PDF Invoice
          </button>

          <input
            ref={pdfInputRef}
            type="file"
            accept=".pdf"
            onChange={handlePdfSelect}
            className="hidden"
          />

          {invoiceData.invoicePdf && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
              <FileText size={24} className="text-purple-600" />
              <div className="flex-1">
                <p className="font-medium">{invoiceData.invoicePdf.name}</p>
                <p className="text-sm text-gray-600">
                  {(invoiceData.invoicePdf.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              <button
                type="button"
                onClick={removePdf}
                className="p-1 text-red-600 hover:bg-red-100 rounded"
              >
                <X size={20} />
              </button>
            </div>
          )}
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="border-t pt-6">
            <h4 className="text-md font-semibold text-gray-900 mb-3">Uploading to Lighthouse Storage...</h4>
            {Object.entries(uploadProgress).map(([filename, progress]) => (
              <div key={filename} className="mb-2">
                <div className="flex justify-between text-sm mb-1">
                  <span>{filename}</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Storage Proofs */}
        {storageProofs.length > 0 && (
          <div className="border-t pt-6">
            <h4 className="text-md font-semibold text-gray-900 mb-3">Storage Proofs</h4>
            <div className="space-y-2">
              {storageProofs.map((proof, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-green-50 rounded-md">
                  <CheckCircle size={20} className="text-green-600" />
                  <div className="flex-1">
                    <p className="font-medium">{proof.name}</p>
                    <p className="text-sm text-gray-600">CID: {proof.cid}</p>
                    <p className="text-xs text-gray-500">Size: {proof.size} bytes</p>
                  </div>
                  <a
                    href={`https://gateway.lighthouse.storage/ipfs/${proof.cid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm underline"
                  >
                    View on IPFS
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Errors */}
        {uploadErrors.length > 0 && (
          <div className="border-t pt-6">
            <h4 className="text-md font-semibold text-red-900 mb-3">Upload Errors</h4>
            <div className="space-y-2">
              {uploadErrors.map((error, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-red-50 rounded-md">
                  <AlertCircle size={20} className="text-red-600" />
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transaction Status */}
        {writeError && (
          <div className="flex items-center gap-3 p-3 bg-red-50 rounded-md">
            <AlertCircle size={20} className="text-red-600" />
            <p className="text-red-800">Transaction Error: {writeError.message}</p>
          </div>
        )}

        {hash && (
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-md">
            <CheckCircle size={20} className="text-blue-600" />
            <p className="text-blue-800">
              Transaction Hash: {hash}
              {isConfirming && <span className="ml-2">(Confirming...)</span>}
              {isConfirmed && <span className="ml-2 text-green-600">(Confirmed!)</span>}
            </p>
          </div>
        )}

        {/* Submit Button */}
        <div className="border-t pt-6">
          <button
            type="button"
            onClick={registerProduct}
            disabled={!isConnected || isRegistering || isUploading || isWritePending || isConfirming}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {(isRegistering || isUploading || isWritePending || isConfirming) && (
              <Loader2 size={20} className="animate-spin" />
            )}
            {isRegistering ? 'Uploading & Registering...' : 
             isUploading ? 'Uploading to Lighthouse...' :
             isWritePending ? 'Confirming Transaction...' :
             isConfirming ? 'Transaction Confirming...' :
             'Register Product'}
          </button>

          {!isConnected && (
            <p className="text-center text-red-600 text-sm mt-2">
              Please connect your wallet to register a product
            </p>
          )}
        </div>
      </form>
    </div>
  )
}
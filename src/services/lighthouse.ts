// services/lighthouse.ts
import lighthouse from '@lighthouse-web3/sdk'

export interface FileUploadResult {
  hash: string
  name: string
  size: number
  type: string
  url: string
}

export interface ProductFiles {
  images: FileUploadResult[]
  pdfs: FileUploadResult[]
}

class LighthouseService {
  private apiKey: string

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_LIGHTHOUSE_API_KEY || ''
    if (!this.apiKey) {
      console.warn('Lighthouse API key not found. Please set NEXT_PUBLIC_LIGHTHOUSE_API_KEY')
    }
  }

  /**
   * Upload a single file to Lighthouse/IPFS
   */
  async uploadFile(file: File): Promise<FileUploadResult> {
    try {
      if (!this.apiKey) {
        throw new Error('Lighthouse API key is required')
      }

      // Validate file type
      this.validateFile(file)

      // Upload to Lighthouse
      const output = await lighthouse.upload([file], this.apiKey)
      
      if (!output.data || !output.data.Hash) {
        throw new Error('Failed to upload file to Lighthouse')
      }

      const result: FileUploadResult = {
        hash: output.data.Hash,
        name: file.name,
        size: file.size,
        type: file.type,
        url: `https://gateway.lighthouse.storage/ipfs/${output.data.Hash}`
      }

      console.log('File uploaded successfully:', result)
      return result

    } catch (error) {
      console.error('Error uploading file:', error)
      throw new Error(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Upload multiple files with progress tracking
   */
  async uploadMultipleFiles(
    files: File[], 
    onProgress?: (progress: { completed: number; total: number; currentFile: string }) => void
  ): Promise<FileUploadResult[]> {
    const results: FileUploadResult[] = []
    let completed = 0

    for (const file of files) {
      try {
        onProgress?.({ completed, total: files.length, currentFile: file.name })
        
        const result = await this.uploadFile(file)
        results.push(result)
        completed++
        
        onProgress?.({ completed, total: files.length, currentFile: file.name })
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error)
        // Continue with other files, but track the error
        throw error
      }
    }

    return results
  }

  /**
   * Upload product files (images and PDFs) in organized structure
   */
  async uploadProductFiles(
    images: File[],
    pdfs: File[],
    onProgress?: (progress: { 
      stage: 'images' | 'pdfs' | 'complete'
      completed: number
      total: number
      currentFile: string 
    }) => void
  ): Promise<ProductFiles> {
    const productFiles: ProductFiles = {
      images: [],
      pdfs: []
    }

    // Upload images first
    if (images.length > 0) {
      onProgress?.({ stage: 'images', completed: 0, total: images.length, currentFile: '' })
      
      try {
        productFiles.images = await this.uploadMultipleFiles(images, (progress) => {
          onProgress?.({ 
            stage: 'images', 
            completed: progress.completed, 
            total: progress.total, 
            currentFile: progress.currentFile 
          })
        })
      } catch (error) {
        throw new Error(`Failed to upload images: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Upload PDFs
    if (pdfs.length > 0) {
      onProgress?.({ stage: 'pdfs', completed: 0, total: pdfs.length, currentFile: '' })
      
      try {
        productFiles.pdfs = await this.uploadMultipleFiles(pdfs, (progress) => {
          onProgress?.({ 
            stage: 'pdfs', 
            completed: progress.completed, 
            total: progress.total, 
            currentFile: progress.currentFile 
          })
        })
      } catch (error) {
        throw new Error(`Failed to upload PDFs: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    onProgress?.({ stage: 'complete', completed: 1, total: 1, currentFile: '' })
    return productFiles
  }

  /**
   * Validate file before upload
   */
  private validateFile(file: File): void {
    const maxSize = 100 * 1024 * 1024 // 100MB
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    const allowedPdfTypes = ['application/pdf']
    const allowedTypes = [...allowedImageTypes, ...allowedPdfTypes]

    if (file.size > maxSize) {
      throw new Error(`File ${file.name} is too large. Maximum size is 100MB.`)
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error(`File ${file.name} has unsupported type. Only images (JPEG, PNG, GIF, WebP) and PDFs are allowed.`)
    }
  }

  /**
   * Get file info from IPFS hash
   */
  async getFileInfo(hash: string): Promise<{ accessible: boolean; url: string }> {
    try {
      const url = `https://gateway.lighthouse.storage/ipfs/${hash}`
      const response = await fetch(url, { method: 'HEAD' })
      
      return {
        accessible: response.ok,
        url: url
      }
    } catch (error) {
      console.error('Error checking file accessibility:', error)
      return {
        accessible: false,
        url: `https://gateway.lighthouse.storage/ipfs/${hash}`
      }
    }
  }

  /**
   * Create metadata object for blockchain storage
   */
  createMetadata(productFiles: ProductFiles, productInfo: {
    name: string
    description: string
    manufacturer: string
    model?: string
    serialNumber?: string
  }) {
    return {
      product: productInfo,
      files: {
        images: productFiles.images.map(img => ({
          hash: img.hash,
          name: img.name,
          size: img.size,
          type: img.type,
          url: img.url
        })),
        pdfs: productFiles.pdfs.map(pdf => ({
          hash: pdf.hash,
          name: pdf.name,
          size: pdf.size,
          type: pdf.type,
          url: pdf.url
        }))
      },
      uploadedAt: new Date().toISOString(),
      version: '1.0'
    }
  }

  /**
   * Calculate total storage cost estimate
   */
  calculateStorageCost(files: File[]): { totalSizeMB: number; estimatedCostUSD: number } {
    const totalSizeBytes = files.reduce((sum, file) => sum + file.size, 0)
    const totalSizeMB = totalSizeBytes / (1024 * 1024)
    
    // Lighthouse pricing is approximately $0.0014 per GB per month
    // This is a rough estimate for permanent storage
    const estimatedCostUSD = (totalSizeMB / 1024) * 0.0014 * 12 // Annual cost
    
    return {
      totalSizeMB: Math.round(totalSizeMB * 100) / 100,
      estimatedCostUSD: Math.round(estimatedCostUSD * 10000) / 10000
    }
  }
}

// Export singleton instance
export const lighthouseService = new LighthouseService()

// Helper functions
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/')
}

export const isPdfFile = (file: File): boolean => {
  return file.type === 'application/pdf'
}

// Type guards for uploaded files
export const separateFilesByType = (files: File[]): { images: File[]; pdfs: File[] } => {
  return files.reduce(
    (acc, file) => {
      if (isImageFile(file)) {
        acc.images.push(file)
      } else if (isPdfFile(file)) {
        acc.pdfs.push(file)
      }
      return acc
    },
    { images: [] as File[], pdfs: [] as File[] }
  )
}
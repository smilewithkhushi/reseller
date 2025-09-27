// app/page.tsx
'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RegisterProduct } from '@/components/RegisterProduct'
import CreateInvoice from '@/components/CreateInvoice'
import { ProductAuditTrail } from '@/components/ProductAuditTrail'
import { TransferCertificate } from '@/components/TransferCertificate'
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '@/config/contract'

export default function Home() {
  const { address, isConnected } = useAccount()
  const [activeTab, setActiveTab] = useState('register')
const contractAddress = CONTRACT_ADDRESS;
const abi = CONTRACT_ABI; 
  if (!isConnected) {
    return (
      <div className="px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Product Provenance System
          </h1>
          <p className="text-xl text-slate-600 mb-8">
            Track product authenticity and ownership history on the blockchain
          </p>
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold mb-4">Get Started</h2>
            <p className="text-slate-600 mb-6">
              Connect your wallet to register products, create invoices, and manage transfers
            </p>
            <div className="text-sm text-slate-500">
              Please connect your wallet using the button in the top right corner
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Product Provenance Dashboard
          </h1>
          <p className="text-slate-600">
            Manage your products, invoices, and transfers on the blockchain
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="register">Register Product</TabsTrigger>
            <TabsTrigger value="invoice">Create Invoice</TabsTrigger>
            <TabsTrigger value="transfer">Transfer Certificate</TabsTrigger>
            <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          </TabsList>

          <TabsContent value="register" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Register New Product</CardTitle>
                <CardDescription>
                  Register a new product on the blockchain to start tracking its provenance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RegisterProduct />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoice" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Create Invoice</CardTitle>
                <CardDescription>
                  Create an invoice for a product sale with decentralized storage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CreateInvoice
                contractAddress={contractAddress}
                abi={abi}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transfer" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Transfer Certificate</CardTitle>
                <CardDescription>
                  Manage ownership transfers with dual-signature verification
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TransferCertificate />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Product Audit Trail</CardTitle>
                <CardDescription>
                  View complete ownership and transaction history for any product
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProductAuditTrail />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
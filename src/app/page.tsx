
'use client'

import CreateInvoice from '@/components/CreateInvoice'
import { ProductAuditTrail } from '@/components/ProductAuditTrail'
import RegisterProduct from '@/components/RegisterProduct'
import { TransferCertificate } from '@/components/TransferCertificate'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '@/config/contract'
import {
  Activity,
  AlertCircle,
  ArrowRightLeft,
  BarChart3,
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  FileText,
  Filter,
  Package,
  Search,
  TrendingUp
} from 'lucide-react'
import { useState } from 'react'
import { useAccount } from 'wagmi'

export default function Home() {
  const { address, isConnected } = useAccount()
  const [selectedView, setSelectedView] = useState<'register' | 'invoice' | 'transfer' | 'audit' | null>(null)
  const contractAddress = CONTRACT_ADDRESS;
  const abi = CONTRACT_ABI;

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-3">
              ProofRail : Product Provenance System
            </h1>
            <p className="text-slate-600 mb-8">
              Connect your wallet to access the complete product management dashboard
            </p>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-500">
                Please connect your wallet using the button in the top right corner to continue
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Mock data for dashboard stats
  const dashboardStats = [
    {
      title: "Total Products",
      value: "1,247",
      change: "+12.5%",
      trend: "up",
      icon: Package,
      color: "bg-blue-500"
    },
    {
      title: "Active Invoices",
      value: "89",
      change: "+5.2%",
      trend: "up", 
      icon: FileText,
      color: "bg-green-500"
    },
    {
      title: "Pending Transfers",
      value: "23",
      change: "-2.1%",
      trend: "down",
      icon: ArrowRightLeft,
      color: "bg-orange-500"
    },
    {
      title: "Revenue (30d)",
      value: "$45,210",
      change: "+18.7%",
      trend: "up",
      icon: DollarSign,
      color: "bg-purple-500"
    }
  ]

  // Mock recent activity data
  const recentActivity = [
    { id: 1, type: "product", action: "Product #P-001 registered", time: "2 minutes ago", status: "success" },
    { id: 2, type: "invoice", action: "Invoice #INV-245 created", time: "15 minutes ago", status: "success" },
    { id: 3, type: "transfer", action: "Transfer #T-089 pending approval", time: "1 hour ago", status: "pending" },
    { id: 4, type: "audit", action: "Audit trail requested for P-055", time: "2 hours ago", status: "info" },
    { id: 5, type: "transfer", action: "Transfer #T-087 completed", time: "3 hours ago", status: "success" },
  ]

  const quickActions = [
    { 
      title: "Register Product", 
      description: "Add new product to blockchain", 
      icon: Package, 
      action: () => setSelectedView('register'),
      color: "bg-blue-500 hover:bg-blue-600"
    },
    { 
      title: "Create Invoice", 
      description: "Generate product invoice", 
      icon: FileText, 
      action: () => setSelectedView('invoice'),
      color: "bg-green-500 hover:bg-green-600"
    },
    { 
      title: "Transfer Certificate", 
      description: "Manage ownership transfers", 
      icon: ArrowRightLeft, 
      action: () => setSelectedView('transfer'),
      color: "bg-orange-500 hover:bg-orange-600"
    },
    { 
      title: "View Audit Trail", 
      description: "Track product history", 
      icon: Search, 
      action: () => setSelectedView('audit'),
      color: "bg-purple-500 hover:bg-purple-600"
    }
  ]

  if (selectedView) {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  onClick={() => setSelectedView(null)}
                  className="text-slate-600 hover:text-slate-900"
                >
                  ← Back to Dashboard
                </Button>
                <div className="h-6 w-px bg-slate-300" />
                <h1 className="text-xl font-semibold text-slate-900 capitalize">
                  {selectedView === 'register' && 'Register Product'}
                  {selectedView === 'invoice' && 'Create Invoice'}
                  {selectedView === 'transfer' && 'Transfer Certificate'}
                  {selectedView === 'audit' && 'Product Audit Trail'}
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>
                {selectedView === 'register' && 'Register New Product'}
                {selectedView === 'invoice' && 'Create Invoice'}
                {selectedView === 'transfer' && 'Transfer Certificate'}
                {selectedView === 'audit' && 'Product Audit Trail'}
              </CardTitle>
              <CardDescription>
                {selectedView === 'register' && 'Register a new product on the blockchain to start tracking its provenance'}
                {selectedView === 'invoice' && 'Create an invoice for a product sale with decentralized storage'}
                {selectedView === 'transfer' && 'Manage ownership transfers with dual-signature verification'}
                {selectedView === 'audit' && 'View complete ownership and transaction history for any product'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedView === 'register' && <RegisterProduct />}
              {selectedView === 'invoice' && <CreateInvoice contractAddress={contractAddress} abi={abi} />}
              {selectedView === 'transfer' && <TransferCertificate />}
              {selectedView === 'audit' && <ProductAuditTrail />}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">ProofRail : Product Provenance Dashboard</h1>
              <p className="text-sm text-slate-600">Manage your blockchain-based product ecosystem</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {dashboardStats.map((stat, index) => (
            <Card key={index} className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                    <div className="flex items-center mt-2">
                      <TrendingUp className={`w-4 h-4 mr-1 ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}`} />
                      <span className={`text-sm font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                        {stat.change}
                      </span>
                      <span className="text-sm text-slate-500 ml-1">vs last month</span>
                    </div>
                  </div>
                  <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <Card className="shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <Activity className="w-5 h-5 mr-2 text-blue-600" />
                      Quick Actions
                    </CardTitle>
                    <CardDescription>Manage your products and transactions</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quickActions.map((action, index) => (
                    <div
                      key={index}
                      onClick={action.action}
                      className="p-4 rounded-lg border-2 border-slate-200 hover:border-slate-300 cursor-pointer transition-all hover:shadow-md group"
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          <action.icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                            {action.title}
                          </h3>
                          <p className="text-sm text-slate-600 mt-1">{action.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Chart Section */}
            <Card className="shadow-sm mt-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
                  Analytics Overview
                </CardTitle>
                <CardDescription>Product registration and transaction trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-slate-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600">Analytics charts will be displayed here</p>
                    <p className="text-sm text-slate-500">Integration with chart libraries coming soon</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-1">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-orange-600" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Latest system updates and transactions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex-shrink-0 mt-1">
                      {activity.status === 'success' && <CheckCircle className="w-4 h-4 text-green-500" />}
                      {activity.status === 'pending' && <Clock className="w-4 h-4 text-orange-500" />}
                      {activity.status === 'info' && <AlertCircle className="w-4 h-4 text-blue-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">{activity.action}</p>
                      <p className="text-xs text-slate-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* System Status */}
            <Card className="shadow-sm mt-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-purple-600" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Blockchain Network</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Online
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Smart Contract</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">IPFS Storage</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Connected
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
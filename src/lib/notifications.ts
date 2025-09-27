// lib/notifications.ts - Notification service with Resend
import { Resend } from 'resend'
import { prisma } from './prisma'

interface NotificationData {
  userId: string
  title: string
  message: string
  type: string
  data?: any
  sendEmail?: boolean
}

interface EmailTemplate {
  subject: string
  html: string
  text?: string
}

export class NotificationService {
  private resend: Resend | null = null

  constructor() {
    if (process.env.RESEND_API_KEY) {
      this.resend = new Resend(process.env.RESEND_API_KEY)
    }
  }

  async send(notification: NotificationData) {
    try {
      // Create database notification
      const dbNotification = await prisma.notification.create({
        data: {
          userId: notification.userId,
          title: notification.title,
          message: notification.message,
          type: notification.type as any,
          data: notification.data
        }
      })

      // Send email if requested and configured
      if (notification.sendEmail && this.resend) {
        await this.sendEmail(notification)
      }

      return dbNotification
    } catch (error) {
      console.error('Failed to send notification:', error)
      throw error
    }
  }

  private async sendEmail(notification: NotificationData) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: notification.userId }
      })

      if (!user?.email || !this.resend) return

      const template = this.getEmailTemplate(notification)

      const { data, error } = await this.resend.emails.send({
        from: process.env.FROM_EMAIL || 'Product Provenance <noreply@your-domain.com>',
        to: [user.email],
        subject: template.subject,
        html: template.html,
        text: template.text,
        tags: [
          {
            name: 'category',
            value: 'notification'
          },
          {
            name: 'type',
            value: notification.type
          }
        ]
      })

      if (error) {
        console.error('Resend email error:', error)
        throw error
      }

      console.log('Email sent successfully:', data?.id)
      return data

    } catch (error) {
      console.error('Failed to send email via Resend:', error)
      throw error
    }
  }

  private getEmailTemplate(notification: NotificationData): EmailTemplate {
    const baseTemplate = {
      subject: notification.title,
      html: this.generateEmailHTML(notification),
      text: this.generateEmailText(notification)
    }

    // Customize templates based on notification type
    switch (notification.type) {
      case 'PRODUCT_REGISTERED':
        return {
          ...baseTemplate,
          subject: `✅ Product Successfully Registered - ${notification.data?.productName || 'Your Product'}`
        }

      case 'INVOICE_RECEIVED':
        return {
          ...baseTemplate,
          subject: `💸 New Invoice Received - ${notification.data?.productName || 'Product Sale'}`
        }

      case 'TRANSFER_PENDING':
        return {
          ...baseTemplate,
          subject: `⏳ Transfer Signature Required - ${notification.data?.productName || 'Product Transfer'}`
        }

      case 'TRANSFER_SIGNED':
        return {
          ...baseTemplate,
          subject: `✍️ Transfer Certificate Signed - ${notification.data?.productName || 'Product Transfer'}`
        }

      case 'TRANSFER_COMPLETED':
        return {
          ...baseTemplate,
          subject: `🎉 Ownership Transfer Complete - ${notification.data?.productName || 'Product Transfer'}`
        }

      case 'PAYMENT_REMINDER':
        return {
          ...baseTemplate,
          subject: `💰 Payment Reminder - Invoice Due Soon`
        }

      case 'DISPUTE_ALERT':
        return {
          ...baseTemplate,
          subject: `⚠️ Dispute Alert - Immediate Attention Required`
        }

      default:
        return baseTemplate
    }
  }

  private generateEmailHTML(notification: NotificationData): string {
    const { title, message, type, data } = notification

    // Get notification-specific styling
    const { bgColor, iconColor, actionButton } = this.getNotificationStyling(type, data)

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">
              🔗 Product Provenance
            </h1>
          </div>

          <!-- Content -->
          <div style="padding: 40px 30px;">
            
            <!-- Notification Icon & Title -->
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 80px; height: 80px; border-radius: 50%; background-color: ${bgColor}; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 32px;">
                ${this.getNotificationIcon(type)}
              </div>
              <h2 style="color: #1f2937; margin: 0; font-size: 20px; font-weight: 600;">
                ${title}
              </h2>
            </div>

            <!-- Message -->
            <div style="background-color: #f9fafb; border-left: 4px solid ${iconColor}; padding: 20px; margin-bottom: 30px; border-radius: 4px;">
              <p style="color: #374151; margin: 0; line-height: 1.6; font-size: 16px;">
                ${message}
              </p>
            </div>

            <!-- Product/Transaction Details -->
            ${data ? this.generateDetailsSection(data) : ''}

            <!-- Action Button -->
            ${actionButton ? `
              <div style="text-align: center; margin: 30px 0;">
                <a href="${actionButton.url}" style="display: inline-block; background-color: ${iconColor}; color: white; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 16px; transition: all 0.3s ease;">
                  ${actionButton.text}
                </a>
              </div>
            ` : ''}

            <!-- Divider -->
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

            <!-- Footer -->
            <div style="text-align: center;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                This notification was sent from the Product Provenance DApp
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                You're receiving this email because you're involved in blockchain product transactions.
              </p>
            </div>
          </div>

          <!-- App Link Footer -->
          <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com'}" style="color: #3b82f6; text-decoration: none; font-weight: 500;">
                Open Product Provenance App
              </a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  private generateEmailText(notification: NotificationData): string {
    const { title, message, data } = notification
    
    let text = `${title}\n\n${message}\n\n`
    
    if (data) {
      if (data.productName) text += `Product: ${data.productName}\n`
      if (data.productId) text += `Product ID: ${data.productId}\n`
      if (data.transactionHash) text += `Transaction: ${data.transactionHash}\n`
      if (data.amount) text += `Amount: ${data.amount} ${data.currency || 'ETH'}\n`
    }
    
    text += `\nThis notification was sent from the Product Provenance DApp.\n`
    text += `View more details: ${process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com'}`
    
    return text
  }

  private getNotificationStyling(type: string, data?: any) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com'
    
    switch (type) {
      case 'PRODUCT_REGISTERED':
        return {
          bgColor: '#ecfdf5',
          iconColor: '#10b981',
          actionButton: data?.productId ? {
            text: 'View Product',
            url: `${baseUrl}/products/${data.productId}`
          } : null
        }

      case 'INVOICE_RECEIVED':
        return {
          bgColor: '#eff6ff',
          iconColor: '#3b82f6',
          actionButton: data?.invoiceId ? {
            text: 'View Invoice',
            url: `${baseUrl}/invoices/${data.invoiceId}`
          } : null
        }

      case 'TRANSFER_PENDING':
        return {
          bgColor: '#fef3c7',
          iconColor: '#f59e0b',
          actionButton: data?.certificateId ? {
            text: 'Sign Transfer',
            url: `${baseUrl}/transfers/${data.certificateId}`
          } : null
        }

      case 'TRANSFER_SIGNED':
        return {
          bgColor: '#e0e7ff',
          iconColor: '#6366f1',
          actionButton: data?.certificateId ? {
            text: 'View Transfer',
            url: `${baseUrl}/transfers/${data.certificateId}`
          } : null
        }

      case 'TRANSFER_COMPLETED':
        return {
          bgColor: '#ecfdf5',
          iconColor: '#10b981',
          actionButton: data?.productId ? {
            text: 'View Product',
            url: `${baseUrl}/products/${data.productId}`
          } : null
        }

      case 'PAYMENT_REMINDER':
        return {
          bgColor: '#fef2f2',
          iconColor: '#ef4444',
          actionButton: data?.invoiceId ? {
            text: 'Pay Invoice',
            url: `${baseUrl}/invoices/${data.invoiceId}`
          } : null
        }

      case 'DISPUTE_ALERT':
        return {
          bgColor: '#fef2f2',
          iconColor: '#dc2626',
          actionButton: {
            text: 'View Dispute',
            url: `${baseUrl}/disputes`
          }
        }

      default:
        return {
          bgColor: '#f3f4f6',
          iconColor: '#6b7280',
          actionButton: null
        }
    }
  }

  private getNotificationIcon(type: string): string {
    switch (type) {
      case 'PRODUCT_REGISTERED': return '📦'
      case 'INVOICE_RECEIVED': return '💸'
      case 'TRANSFER_PENDING': return '⏳'
      case 'TRANSFER_SIGNED': return '✍️'
      case 'TRANSFER_COMPLETED': return '🎉'
      case 'PAYMENT_REMINDER': return '💰'
      case 'DISPUTE_ALERT': return '⚠️'
      case 'SYSTEM_UPDATE': return '🔔'
      default: return '📄'
    }
  }

  private generateDetailsSection(data: any): string {
    if (!data) return ''

    let details = '<div style="background-color: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 20px; margin-bottom: 20px;">'
    details += '<h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">Transaction Details</h3>'
    details += '<div style="display: grid; gap: 10px;">'

    if (data.productName) {
      details += `<div style="display: flex; justify-content: space-between;"><span style="color: #6b7280;">Product:</span><span style="color: #1f2937; font-weight: 500;">${data.productName}</span></div>`
    }

    if (data.productId) {
      details += `<div style="display: flex; justify-content: space-between;"><span style="color: #6b7280;">Product ID:</span><span style="color: #1f2937; font-weight: 500;">#${data.productId}</span></div>`
    }

    if (data.amount && data.currency) {
      details += `<div style="display: flex; justify-content: space-between;"><span style="color: #6b7280;">Amount:</span><span style="color: #1f2937; font-weight: 500;">${data.amount} ${data.currency}</span></div>`
    }

    if (data.transactionHash) {
      const shortHash = `${data.transactionHash.slice(0, 10)}...${data.transactionHash.slice(-8)}`
      details += `<div style="display: flex; justify-content: space-between;"><span style="color: #6b7280;">Transaction:</span><span style="color: #1f2937; font-weight: 500; font-family: monospace;">${shortHash}</span></div>`
    }

    if (data.dueDate) {
      const dueDate = new Date(data.dueDate).toLocaleDateString()
      details += `<div style="display: flex; justify-content: space-between;"><span style="color: #6b7280;">Due Date:</span><span style="color: #1f2937; font-weight: 500;">${dueDate}</span></div>`
    }

    details += '</div></div>'
    return details
  }

  async markAsRead(notificationIds: string[], userId: string) {
    return prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId
      },
      data: {
        read: true,
        readAt: new Date()
      }
    })
  }

  async getUnreadCount(userId: string) {
    return prisma.notification.count({
      where: {
        userId,
        read: false
      }
    })
  }

  async sendBulkNotifications(notifications: NotificationData[]) {
    const promises = notifications.map(notification => this.send(notification))
    return Promise.allSettled(promises)
  }

  // Helper method to send specific notification types
  async sendProductRegistered(userId: string, productData: any) {
    return this.send({
      userId,
      title: 'Product Successfully Registered',
      message: `Your product "${productData.name}" has been successfully registered on the blockchain.`,
      type: 'PRODUCT_REGISTERED',
      data: productData,
      sendEmail: true
    })
  }

  async sendInvoiceReceived(userId: string, invoiceData: any) {
    return this.send({
      userId,
      title: 'New Invoice Received',
      message: `You have received an invoice for "${invoiceData.productName}".`,
      type: 'INVOICE_RECEIVED',
      data: invoiceData,
      sendEmail: true
    })
  }

  async sendTransferPending(userId: string, transferData: any) {
    return this.send({
      userId,
      title: 'Transfer Signature Required',
      message: `Please sign the transfer certificate for "${transferData.productName}".`,
      type: 'TRANSFER_PENDING',
      data: transferData,
      sendEmail: true
    })
  }

  async sendTransferCompleted(userId: string, transferData: any) {
    return this.send({
      userId,
      title: 'Ownership Transfer Complete',
      message: `The ownership transfer for "${transferData.productName}" has been completed successfully.`,
      type: 'TRANSFER_COMPLETED',
      data: transferData,
      sendEmail: true
    })
  }
}

// Export singleton instance
export const notificationService = new NotificationService()
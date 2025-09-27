-- CreateEnum
CREATE TYPE "public"."ProductStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'TRANSFERRED', 'DISPUTED', 'LOST', 'DESTROYED');

-- CreateEnum
CREATE TYPE "public"."InvoiceStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "public"."AuditAction" AS ENUM ('PRODUCT_REGISTERED', 'PRODUCT_UPDATED', 'INVOICE_CREATED', 'INVOICE_UPDATED', 'TRANSFER_INITIATED', 'TRANSFER_SIGNED', 'TRANSFER_COMPLETED', 'USER_REGISTERED', 'USER_UPDATED', 'METADATA_UPLOADED', 'DISPUTE_CREATED', 'DISPUTE_RESOLVED');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('PRODUCT_REGISTERED', 'INVOICE_RECEIVED', 'TRANSFER_PENDING', 'TRANSFER_SIGNED', 'TRANSFER_COMPLETED', 'PAYMENT_REMINDER', 'DISPUTE_ALERT', 'SYSTEM_UPDATE');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "email" TEXT,
    "username" TEXT,
    "avatar" TEXT,
    "bio" TEXT,
    "website" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."products" (
    "id" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "manufacturer" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "sku" TEXT,
    "barcode" TEXT,
    "metadataHash" TEXT NOT NULL,
    "metadataUri" TEXT,
    "images" TEXT[],
    "documents" TEXT[],
    "contractAddress" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "blockNumber" BIGINT,
    "transactionHash" TEXT NOT NULL,
    "initialOwnerId" TEXT NOT NULL,
    "currentOwnerId" TEXT NOT NULL,
    "registrationTimestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "public"."ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."invoices" (
    "id" TEXT NOT NULL,
    "invoiceId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "sellerId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "amount" DECIMAL(65,30),
    "currency" TEXT,
    "description" TEXT,
    "paymentTerms" TEXT,
    "dueDate" TIMESTAMP(3),
    "invoiceHash" TEXT NOT NULL,
    "lighthouseUri" TEXT NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "blockNumber" BIGINT,
    "transactionHash" TEXT NOT NULL,
    "status" "public"."InvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "isTransferComplete" BOOLEAN NOT NULL DEFAULT false,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."transfer_certificates" (
    "id" TEXT NOT NULL,
    "certificateId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "invoiceId" INTEGER NOT NULL,
    "sellerId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "certificateHash" TEXT NOT NULL,
    "lighthouseUri" TEXT NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "blockNumber" BIGINT,
    "transactionHash" TEXT NOT NULL,
    "sellerSigned" BOOLEAN NOT NULL DEFAULT false,
    "buyerSigned" BOOLEAN NOT NULL DEFAULT false,
    "sellerSignedAt" TIMESTAMP(3),
    "buyerSignedAt" TIMESTAMP(3),
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transfer_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" TEXT NOT NULL,
    "action" "public"."AuditAction" NOT NULL,
    "description" TEXT NOT NULL,
    "userId" TEXT,
    "productId" INTEGER,
    "invoiceId" INTEGER,
    "transferId" INTEGER,
    "transactionHash" TEXT,
    "blockNumber" BIGINT,
    "chainId" INTEGER,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."product_tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "data" JSONB,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sync_status" (
    "id" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "lastSyncBlock" BIGINT NOT NULL DEFAULT 0,
    "lastSyncAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "syncErrors" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sync_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."api_usage" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "ipAddress" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 1,
    "lastRequest" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "windowStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_ProductToProductTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProductToProductTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_address_key" ON "public"."users"("address");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "public"."users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "products_productId_key" ON "public"."products"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoiceId_key" ON "public"."invoices"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "transfer_certificates_certificateId_key" ON "public"."transfer_certificates"("certificateId");

-- CreateIndex
CREATE UNIQUE INDEX "product_tags_name_key" ON "public"."product_tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "sync_status_chainId_key" ON "public"."sync_status"("chainId");

-- CreateIndex
CREATE INDEX "_ProductToProductTag_B_index" ON "public"."_ProductToProductTag"("B");

-- AddForeignKey
ALTER TABLE "public"."products" ADD CONSTRAINT "products_initialOwnerId_fkey" FOREIGN KEY ("initialOwnerId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."products" ADD CONSTRAINT "products_currentOwnerId_fkey" FOREIGN KEY ("currentOwnerId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invoices" ADD CONSTRAINT "invoices_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invoices" ADD CONSTRAINT "invoices_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."invoices" ADD CONSTRAINT "invoices_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("productId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transfer_certificates" ADD CONSTRAINT "transfer_certificates_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transfer_certificates" ADD CONSTRAINT "transfer_certificates_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transfer_certificates" ADD CONSTRAINT "transfer_certificates_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("productId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transfer_certificates" ADD CONSTRAINT "transfer_certificates_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "public"."invoices"("invoiceId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("productId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "public"."invoices"("invoiceId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "public"."transfer_certificates"("certificateId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_ProductToProductTag" ADD CONSTRAINT "_ProductToProductTag_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_ProductToProductTag" ADD CONSTRAINT "_ProductToProductTag_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."product_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;



// lib/email-templates.tsx - React Email Templates (Optional Enhancement)
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface ProductRegisteredEmailProps {
  productName: string
  productId: string
  ownerName: string
  transactionHash: string
  appUrl: string
}

export function ProductRegisteredEmail({
  productName,
  productId,
  ownerName,
  transactionHash,
  appUrl
}: ProductRegisteredEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your product {productName} has been successfully registered</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>🔗 Product Provenance</Heading>
          </Section>

          <Section style={content}>
            <Heading style={h2}>Product Successfully Registered! 🎉</Heading>
            
            <Text style={text}>
              Hi {ownerName},
            </Text>
            
            <Text style={text}>
              Great news! Your product <strong>{productName}</strong> has been successfully 
              registered on the blockchain and is now part of our secure provenance system.
            </Text>

            <Section style={detailsBox}>
              <Text style={detailsTitle}>Registration Details:</Text>
              <Text style={details}>Product Name: {productName}</Text>
              <Text style={details}>Product ID: #{productId}</Text>
              <Text style={details}>Transaction: {transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}</Text>
            </Section>

            <Button style={button} href={`${appUrl}/products/${productId}`}>
              View Your Product
            </Button>

            <Text style={text}>
              Your product is now protected by blockchain technology, ensuring its 
              authenticity and ownership history are permanently recorded and verifiable.
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              This email was sent from Product Provenance DApp
            </Text>
            <Link href={appUrl} style={link}>
              Open App
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Styles for React Email
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
}

const header = {
  backgroundColor: '#667eea',
  padding: '24px',
  textAlign: 'center' as const,
}

const h1 = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: '600',
  margin: '0',
}

const content = {
  padding: '40px 48px',
}

const h2 = {
  color: '#1f2937',
  fontSize: '20px',
  fontWeight: '600',
  margin: '0 0 24px',
}

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
}

const detailsBox = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '6px',
  padding: '20px',
  margin: '24px 0',
}

const detailsTitle = {
  color: '#1f2937',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 12px',
}

const details = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '4px 0',
}

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '14px 24px',
  margin: '24px 0',
}

const footer = {
  backgroundColor: '#f9fafb',
  padding: '20px 48px',
  textAlign: 'center' as const,
  borderTop: '1px solid #e5e7eb',
}

const footerText = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0 0 8px',
}

const link = {
  color: '#3b82f6',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: '500',
}




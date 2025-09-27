// Setup script for Resend domain verification
// scripts/setup-resend.js
const { Resend } = require('resend')

async function setupResend() {
  const resend = new Resend(process.env.RESEND_API_KEY)

  try {
    console.log('🔧 Setting up Resend...')

    // Get API key info
    const apiKey = await resend.apiKeys.list()
    console.log('✅ API Key connected:', apiKey.data?.[0]?.name)

    // List domains
    const domains = await resend.domains.list()
    console.log('📧 Domains configured:', domains.data?.length || 0)

    if (domains.data?.length === 0) {
      console.log('⚠️  No domains configured. Please add a domain in Resend dashboard.')
      console.log('   Visit: https://resend.com/domains')
    } else {
      domains.data.forEach((domain: any) => {
        console.log(`   - ${domain.name} (${domain.status})`)
      })
    }

    // Test email send (optional)
    if (process.env.TEST_EMAIL) {
      console.log('📨 Sending test email...')
      const testEmail = await resend.emails.send({
        from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
        to: [process.env.TEST_EMAIL],
        subject: 'Resend Setup Test',
        html: '<h1>Resend is working! 🎉</h1><p>Your Product Provenance app can now send emails.</p>'
      })
      console.log('✅ Test email sent:', testEmail.data?.id)
    }

  } catch (error) {
    console.error('❌ Resend setup failed:', error)
  }
}

if (require.main === module) {
  setupResend()
}

module.exports = { setupResend }

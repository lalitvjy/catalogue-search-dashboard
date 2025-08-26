import 'dotenv/config'
import { sendEmail, createPasswordResetEmail } from '../src/lib/email'

async function testEmail() {
  console.log('Testing email service...')
  console.log('NODE_ENV:', process.env.NODE_ENV)
  console.log('BREVO_API_KEY:', process.env.BREVO_API_KEY ? 'Set' : 'Not set')
  
  try {
    const testEmail = 'test@example.com'
    const resetUrl = 'http://localhost:3000/reset-password?token=test-token'
    
    const emailOptions = createPasswordResetEmail(testEmail, resetUrl)
    await sendEmail(emailOptions)
    
    console.log('✅ Email test completed successfully')
  } catch (error) {
    console.error('❌ Email test failed:', error)
  }
}

testEmail().catch(console.error)

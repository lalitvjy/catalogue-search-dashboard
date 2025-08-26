// Email service using Brevo for production
import * as SibApiV3Sdk from '@getbrevo/brevo'

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  const isProduction = process.env.NODE_ENV === 'production'
  
  if (isProduction) {
    // Use Brevo in production
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi()
    
    // Configure API key authorization
    const apiKey = process.env.BREVO_API_KEY
    if (!apiKey) {
      throw new Error('BREVO_API_KEY environment variable is required for production')
    }
    
    apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, apiKey)
    
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail()
    sendSmtpEmail.subject = options.subject
    sendSmtpEmail.htmlContent = options.html
    sendSmtpEmail.textContent = options.text || ''
    sendSmtpEmail.sender = {
      name: 'Catalogue Search',
      email: process.env.BREVO_FROM_EMAIL || 'noreply@yourdomain.com'
    }
    sendSmtpEmail.to = [{ email: options.to }]
    
    try {
      const result = await apiInstance.sendTransacEmail(sendSmtpEmail)
      console.log('📧 Email sent via Brevo:', result)
    } catch (error) {
      console.error('❌ Failed to send email via Brevo:', error)
      throw error
    }
  } else {
    // In development, just log the email
    console.log('📧 EMAIL SENT (Development):')
    console.log('To:', options.to)
    console.log('Subject:', options.subject)
    console.log('HTML:', options.html)
    console.log('Text:', options.text)
    console.log('---')
  }
}

export function createPasswordResetEmail(email: string, resetUrl: string): EmailOptions {
  return {
    to: email,
    subject: 'Reset your password - Catalogue Search',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Reset Your Password</h2>
        <p>You requested a password reset for your Catalogue Search account.</p>
        <p>Click the button below to reset your password:</p>
        <a href="${resetUrl}" style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">Reset Password</a>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this password reset, you can safely ignore this email.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">This email was sent from your Catalogue Search application.</p>
      </div>
    `,
    text: `
Reset Your Password

You requested a password reset for your Catalogue Search account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request this password reset, you can safely ignore this email.

---
This email was sent from your Catalogue Search application.
    `
  }
}

# Email Setup for Production

This application uses Brevo (formerly Sendinblue) for sending transactional emails in production.

## Setup Instructions

### 1. Create a Brevo Account

1. Go to [Brevo](https://www.brevo.com/) and create an account
2. Verify your email address
3. Complete the account setup

### 2. Get Your API Key

1. Log in to your Brevo dashboard
2. Go to **Settings** → **API Keys**
3. Create a new API key with **SMTP** permissions
4. Copy the API key (it starts with `xkeysib-`)

### 3. Configure Environment Variables

Add these environment variables to your production environment:

```bash
# Brevo Email Service
BREVO_API_KEY="xkeysib-your-api-key-here"
BREVO_FROM_EMAIL="noreply@yourdomain.com"
```

### 4. Verify Your Sender Domain

1. In your Brevo dashboard, go to **Settings** → **Senders & IP**
2. Add and verify your sender domain
3. This ensures better deliverability and prevents emails from going to spam

### 5. Test Email Sending

The application will automatically use Brevo in production when `NODE_ENV=production` and `BREVO_API_KEY` is set.

## Development vs Production

- **Development**: Emails are logged to the console for easy debugging
- **Production**: Emails are sent via Brevo's transactional email service

## Email Templates

The application includes pre-built email templates for:

- Password reset emails
- Account verification (if implemented)
- Welcome emails (if implemented)

## Troubleshooting

### Common Issues

1. **API Key Not Found**: Ensure `BREVO_API_KEY` is set in your environment
2. **Sender Not Verified**: Verify your sender domain in Brevo dashboard
3. **Emails Going to Spam**: Check your domain's SPF and DKIM records

### Brevo Dashboard Features

- **Email Analytics**: Track delivery rates, opens, and clicks
- **Template Management**: Create and manage email templates
- **Contact Management**: Manage your email lists
- **Webhooks**: Set up webhooks for email events

## Alternative Email Services

If you prefer to use a different email service, you can modify the `sendEmail` function in `src/lib/email.ts`:

- **SendGrid**: Use `@sendgrid/mail`
- **AWS SES**: Use `@aws-sdk/client-ses`
- **Resend**: Use `resend`
- **Mailgun**: Use `mailgun.js`

## Security Notes

- Never commit API keys to version control
- Use environment variables for all sensitive configuration
- Regularly rotate your API keys
- Monitor your email sending limits and costs

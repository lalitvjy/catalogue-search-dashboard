# Email Setup for Production

This application uses a transactional email service for sending emails in production.

## Setup Instructions

### 1. Create an Email Service Account

1. Go to your chosen email service provider and create an account
2. Verify your email address
3. Complete the account setup

### 2. Get Your API Key

1. Log in to your email service dashboard
2. Go to **Settings** → **API Keys**
3. Create a new API key with **SMTP** permissions
4. Copy the API key

### 3. Configure Environment Variables

Add these environment variables to your production environment:

```bash
# Email Service Configuration
EMAIL_API_KEY="your-email-service-api-key"
EMAIL_FROM_ADDRESS="noreply@yourdomain.com"
```

### 4. Verify Your Sender Domain

1. In your email service dashboard, go to sender verification settings
2. Add and verify your sender domain
3. This ensures better deliverability and prevents emails from going to spam

### 5. Test Email Sending

The application will automatically use the email service in production when `NODE_ENV=production` and `EMAIL_API_KEY` is set.

## Development vs Production

- **Development**: Emails are logged to the console for easy debugging
- **Production**: Emails are sent via the configured transactional email service

## Email Templates

The application includes pre-built email templates for:

- Password reset emails
- Account verification (if implemented)
- Welcome emails (if implemented)

## Troubleshooting

### Common Issues

1. **API Key Not Found**: Ensure `EMAIL_API_KEY` is set in your environment
2. **Sender Not Verified**: Verify your sender domain in your email service dashboard
3. **Emails Going to Spam**: Check your domain's SPF and DKIM records

### Email Service Dashboard Features

- **Email Analytics**: Track delivery rates, opens, and clicks
- **Template Management**: Create and manage email templates
- **Contact Management**: Manage your email lists
- **Webhooks**: Set up webhooks for email events

## Alternative Email Services

If you prefer to use a different email service, you can modify the `sendEmail` function in `src/lib/email.ts`:

- **Provider A**: Use appropriate SDK
- **Provider B**: Use appropriate SDK
- **Provider C**: Use appropriate SDK
- **Provider D**: Use appropriate SDK

## Security Notes

- Never commit API keys to version control
- Use environment variables for all sensitive configuration
- Regularly rotate your API keys
- Monitor your email sending limits and costs

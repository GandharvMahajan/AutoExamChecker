# Stripe Integration Setup Guide

This guide walks you through setting up Stripe integration for the AutoExamChecker application.

## Prerequisites

- A Stripe account (You can [sign up for free](https://dashboard.stripe.com/register))
- Node.js (LTS version recommended)
- npm or yarn package manager

## Getting Your API Keys

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com/login)
2. Navigate to Developers > API keys
3. Ensure you're in "Test Mode" while developing (toggle in the top right)
4. Copy your Secret Key (starts with `sk_test_`)

## Setting Up Webhook Endpoints

For local development, you'll need to use the Stripe CLI to forward webhook events to your local server:

1. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli)
2. Run `stripe login` to authenticate
3. Run `stripe listen --forward-to http://localhost:5002/api/v1/payment/webhook`
4. The CLI will display a webhook signing secret, which you should copy

## Environment Configuration

Update your `.env` file with the following values:

```
# Stripe API Keys
STRIPE_SECRET_KEY="sk_test_your_test_key_here"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_signing_secret_here"
```

## Testing the Integration

1. Use test card numbers from [Stripe's testing documentation](https://stripe.com/docs/testing)
   - Example card number: 4242 4242 4242 4242
   - Any future expiration date
   - Any 3-digit CVC
   - Any 5-digit ZIP

2. For testing different scenarios, use these test cards:
   - Successful payment: 4242 4242 4242 4242
   - Requires authentication: 4000 0025 0000 3155
   - Declined payment: 4000 0000 0000 9995

## Implementation Notes

The application uses:
- Stripe Checkout for payment processing
- Webhook events to confirm completed payments
- The payment flow:
  1. User selects a plan
  2. Frontend creates a checkout session via the backend API
  3. User is redirected to Stripe Checkout
  4. After payment, user is redirected to success page
  5. Webhook confirms payment and credits are added to user account

## Deploying to Production

When deploying to production:

1. Switch to Live Mode in your Stripe Dashboard
2. Update your environment variables with production keys
3. Set up proper webhook endpoints for your production server
4. Update the success and cancel URLs to your production domain

## Common Issues and Troubleshooting

- **Webhook Events Not Received**: Ensure your webhook forwarding is running and the signing secret is correct
- **Payment Succeeded but Credits Not Added**: Check the webhook handler implementation
- **Checkout Session Creation Fails**: Verify your API key is correctly configured

For more information, refer to the [Stripe API Documentation](https://stripe.com/docs/api). 
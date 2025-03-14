# Stripe Testing Setup

This guide explains how to test Stripe payments locally using the Stripe CLI.

## Prerequisites

1. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli#install)
2. Have both the frontend and backend running locally

## Setup Stripe CLI for Local Testing

1. **Login to your Stripe account with the CLI**:
   ```
   stripe login
   ```

2. **Forward webhook events to your local server**:
   ```
   stripe listen --forward-to http://localhost:5002/api/v1/payment/webhook
   ```
   This command will display a webhook signing secret. Copy this secret and update your `.env` file with:
   ```
   STRIPE_WEBHOOK_SECRET="whsec_..."
   ```

3. **Keep the Stripe CLI running** in a separate terminal while testing payments.

## Test the Payment Flow

1. Navigate to the Pricing page in your app
2. Select a plan and click "Buy Now"
3. Complete the payment using a test card number:
   - For successful payment: 4242 4242 4242 4242
   - Any future expiration date
   - Any three-digit CVC
   - Any five-digit ZIP code

4. After successful payment, you should be redirected to the Payment Success page

## Manually Trigger Webhook Events (Optional)

If you need to test webhook handling directly:

```
stripe trigger payment_intent.succeeded
```

Or for checkout session completion:

```
stripe trigger checkout.session.completed
```

## Troubleshooting

1. **Payment fails to process**:
   - Check that the price IDs in `paymentRoutes.ts` match real products in your Stripe dashboard
   - Ensure your Stripe API key is correct in `.env`

2. **Webhook events not received**:
   - Confirm the Stripe CLI is running and forwarding events
   - Check that the webhook secret in `.env` matches the one from Stripe CLI
   - Verify that express.raw middleware is correctly set up for the webhook route

3. **Stripe dashboard discrepancies**:
   - Remember that test mode and live mode have separate data
   - Ensure you're logged in to the correct Stripe account 
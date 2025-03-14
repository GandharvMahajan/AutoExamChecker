# Stripe Integration for Indian Merchants

This document outlines the specific requirements and adjustments made to comply with Indian regulations for Stripe payments.

## Indian Regulatory Requirements

When using Stripe in India, there are specific regulations that must be followed:

1. **Currency Requirements**: Payments must be processed in Indian Rupee (INR)
2. **Export Documentation**: Only registered Indian businesses (sole proprietorships, limited liability partnerships, companies) can accept international payments, not individuals
3. **Compliance Info**: Additional information must be provided for payment intents

## Adjustments Made in Our Integration

To comply with these requirements, we've made the following changes:

1. **Currency Conversion**: Changed all prices from USD to INR
   - Basic Plan: ₹829 (equivalent to $9.99)
   - Standard Plan: ₹2,074 (equivalent to $24.99)
   - Premium Plan: ₹3,318 (equivalent to $39.99)

2. **Payment Intent Data**: Added required shipping information for digital goods
   ```javascript
   payment_intent_data: {
     description: `AutoExamChecker - ${planDetails.name}`,
     shipping: {
       name: 'AutoExamChecker User',
       address: {
         line1: 'Digital Delivery',
         city: 'Digital Delivery',
         state: 'Digital Delivery',
         postal_code: '000000',
         country: 'IN',
       },
     },
   }
   ```

3. **Frontend Updates**: Updated displayed prices to show INR (₹) instead of USD ($)

## Testing with Indian Cards

When testing, use Indian test cards:

- **Success**: 4242 4242 4242 4242
- **Authentication Required**: 4000 0025 0000 3155
- **Declined**: 4000 0000 0000 9995

## Additional Resources

For more information about Stripe's requirements for Indian merchants:

- [Stripe Docs: Accepting International Payments from India](https://stripe.com/docs/india-exports)
- [Stripe India: Requirements and Verification](https://stripe.com/docs/connect/india-verification)
- [RBI Guidelines for Online Payments in India](https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=11832) 
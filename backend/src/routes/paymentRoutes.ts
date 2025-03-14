import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import auth from '../middleware/auth';
import Stripe from 'stripe';

// Initialize Stripe with secret key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_your_test_key';
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-02-24.acacia',  // Using the latest API version
});

const DOMAIN = process.env.FRONTEND_URL || 'http://localhost:3000';

// Create Prisma client
const prisma = new PrismaClient();

// Create router
const router = Router();

// Plan price information - in a real app, you'd store these in your database or fetch from Stripe
const PLANS = {
  '1': {
    name: 'Basic Plan',
    description: '1 Test Paper Analysis',
    amount: 82900,  // ₹829 (equivalent to $9.99)
    currency: 'inr'
  },
  '3': {
    name: 'Standard Plan',
    description: '3 Test Paper Analyses', 
    amount: 207400, // ₹2074 (equivalent to $24.99)
    currency: 'inr'
  },
  '6': {
    name: 'Premium Plan',
    description: '6 Test Paper Analyses',
    amount: 331800, // ₹3318 (equivalent to $39.99)
    currency: 'inr'
  }
};

// Payment validation rules
const checkoutValidation = [
  body('plan').isIn(['1', '3', '6']).withMessage('Plan must be either 1, 3, or 6'),
];

// Create a Stripe checkout session
const createCheckoutSession = async (req: Request, res: Response) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { plan } = req.body;
    const userId = (req as Request & { user?: { userId: number } }).user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    // Get the plan details
    const planDetails = PLANS[plan as keyof typeof PLANS];
    
    if (!planDetails) {
      res.status(400).json({ message: 'Invalid plan selected' });
      return;
    }

    try {
      // Create checkout session with Stripe
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: planDetails.currency,
              unit_amount: planDetails.amount,
              product_data: {
                name: planDetails.name,
                description: planDetails.description,
              },
            },
          },
        ],
        mode: 'payment',
        success_url: `${DOMAIN}/payment-success?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`,
        cancel_url: `${DOMAIN}/pricing`,
        client_reference_id: userId.toString(),
        metadata: {
          userId: userId.toString(),
          plan: plan,
        },
        // For Indian exports compliance
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
        },
      });

      // Return checkout session URL
      res.status(200).json({
        success: true,
        checkoutUrl: session.url,
        sessionId: session.id
      });
    } catch (stripeError: any) {
      console.error('Stripe checkout error details:', {
        message: stripeError.message,
        type: stripeError.type,
        code: stripeError.code,
        requestId: stripeError.requestId,
        statusCode: stripeError.statusCode,
        params: stripeError.params
      });
      res.status(500).json({ message: 'Error creating checkout session', details: stripeError.message });
    }
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ message: 'Server error during checkout' });
  }
};

// Handle Stripe webhook events
const handleStripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  
  // Use the webhook secret from the environment or the one provided by the Stripe CLI
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;

  try {
    // For the webhook route, we're using express.raw middleware, so req.body is a Buffer
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      endpointSecret
    );
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    res.status(400).json({ message: `Webhook Error: ${err.message}` });
    return;
  }

  // Handle the event
  console.log(`Webhook received: ${event.type}`);
  
  // Handle different event types
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      
      try {
        // Get the user ID and plan from the metadata
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan;
        
        if (!userId || !plan) {
          console.error('Missing user ID or plan in session metadata');
          break;
        }

        // Update user's tests purchased count
        const user = await prisma.user.update({
          where: { id: parseInt(userId) },
          data: {
            testsPurchased: {
              increment: parseInt(plan)
            }
          }
        });

        console.log(`Updated user ${userId} with ${plan} tests`);
      } catch (dbError) {
        console.error('Database error processing payment:', dbError);
      }
      break;
      
    case 'payment_intent.succeeded':
      console.log('Payment intent succeeded');
      break;
      
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.status(200).json({ received: true });
};

// Mock route to handle payment success (for development/testing)
const handlePaymentSuccess = async (req: Request, res: Response) => {
  try {
    const { sessionId, plan } = req.query;
    const userId = (req as Request & { user?: { userId: number } }).user?.userId;

    if (!userId || !plan) {
      res.status(400).json({ message: 'Missing required parameters' });
      return;
    }

    // Convert plan to number
    const planValue = parseInt(plan as string);
    
    try {
      // Update user's tests purchased count
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          testsPurchased: {
            increment: planValue
          }
        },
        // Include all relevant user fields
        select: {
          id: true,
          name: true,
          email: true,
          testsPurchased: true,
          testsUsed: true
        }
      });
      
      res.status(200).json({
        success: true,
        message: 'Payment processed successfully',
        user: updatedUser
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      res.status(500).json({ message: 'Server error during database update' });
    }
  } catch (error) {
    console.error('Payment success handling error:', error);
    res.status(500).json({ message: 'Server error processing payment success' });
  }
};

// Retrieve a user's credit information
const getUserCredits = async (req: Request, res: Response) => {
  try {
    const userId = (req as Request & { user?: { userId: number } }).user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    // Get user credit information
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        testsPurchased: true,
        testsUsed: true
      }
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json({
      success: true,
      testsPurchased: user.testsPurchased,
      testsUsed: user.testsUsed
    });
  } catch (error) {
    console.error('Error fetching user credits:', error);
    res.status(500).json({ message: 'Server error fetching credit information' });
  }
};

// Register routes
// @ts-ignore - Temporarily ignoring TypeScript errors for router registration
router.post('/create-checkout-session', auth, checkoutValidation, createCheckoutSession);
// @ts-ignore - Temporarily ignoring TypeScript errors for router registration
router.post('/webhook', handleStripeWebhook); // No auth, webhooks come from Stripe
// @ts-ignore - Temporarily ignoring TypeScript errors for router registration
router.get('/payment-success', auth, handlePaymentSuccess);
// @ts-ignore - Temporarily ignoring TypeScript errors for router registration
router.get('/user/credits', auth, getUserCredits);
// Removing the simulate-success route as we're now using real Stripe checkout

export default router; 
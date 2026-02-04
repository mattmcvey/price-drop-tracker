import express from 'express';
import Stripe from 'stripe';
import { query } from '../config/database.js';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Stripe webhook handler
router.post('/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        await handleCheckoutComplete(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await handleSubscriptionCanceled(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        console.log(`Payment succeeded for ${invoice.customer}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.log(`Payment failed for ${invoice.customer}`);
        // Could send email to user
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).send('Webhook handler failed');
  }
});

// Handle successful checkout
async function handleCheckoutComplete(session) {
  const { customer, subscription, client_reference_id } = session;

  if (!client_reference_id) {
    console.error('No user ID in checkout session');
    return;
  }

  // Update user
  await query(
    `UPDATE users
     SET is_premium = TRUE,
         stripe_customer_id = $1,
         stripe_subscription_id = $2,
         updated_at = NOW()
     WHERE id = $3`,
    [customer, subscription, client_reference_id]
  );

  console.log(`User ${client_reference_id} upgraded to premium`);
}

// Handle subscription update
async function handleSubscriptionUpdate(subscription) {
  const { customer, id, status } = subscription;

  const isPremium = status === 'active' || status === 'trialing';

  await query(
    `UPDATE users
     SET is_premium = $1,
         stripe_subscription_id = $2,
         updated_at = NOW()
     WHERE stripe_customer_id = $3`,
    [isPremium, id, customer]
  );

  console.log(`Subscription ${id} updated: ${status}`);
}

// Handle subscription cancellation
async function handleSubscriptionCanceled(subscription) {
  const { customer } = subscription;

  await query(
    `UPDATE users
     SET is_premium = FALSE,
         stripe_subscription_id = NULL,
         updated_at = NOW()
     WHERE stripe_customer_id = $1`,
    [customer]
  );

  console.log(`Subscription canceled for customer ${customer}`);
}

export default router;

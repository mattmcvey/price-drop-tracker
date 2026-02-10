import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

console.log('Creating Stripe checkout session...\n');

stripe.checkout.sessions.create({
  mode: 'subscription',
  payment_method_types: ['card'],
  line_items: [{
    price: process.env.STRIPE_PRICE_ID,
    quantity: 1
  }],
  success_url: 'http://localhost:3500/success',
  cancel_url: 'http://localhost:3500/cancel'
})
.then((session) => {
  console.log('✅ Checkout URL created!\n');
  console.log('Open this URL in your browser:');
  console.log(session.url);
  console.log('\nTest card: 4242 4242 4242 4242');
  console.log('Expiry: 12/25');
  console.log('CVC: 123\n');
})
.catch((error) => {
  console.error('Error:', error.message);
});

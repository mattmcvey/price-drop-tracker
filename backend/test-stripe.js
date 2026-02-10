import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

console.log('🧪 Testing Stripe Integration\n');

// Test 1: Verify Stripe connection
console.log('1️⃣ Testing Stripe connection...');
stripe.products.list({ limit: 1 })
  .then(() => {
    console.log('   ✅ Connected to Stripe successfully!\n');

    // Test 2: Verify Price ID exists
    console.log('2️⃣ Testing Price ID...');
    console.log('   Price ID:', process.env.STRIPE_PRICE_ID);

    return stripe.prices.retrieve(process.env.STRIPE_PRICE_ID);
  })
  .then((price) => {
    console.log('   ✅ Price found!');
    console.log('   - Product:', price.product);
    console.log('   - Amount:', `$${price.unit_amount / 100}`);
    console.log('   - Recurring:', price.recurring?.interval || 'N/A');
    console.log('');

    // Test 3: Create test checkout session
    console.log('3️⃣ Creating test checkout session...');

    return stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price: process.env.STRIPE_PRICE_ID,
        quantity: 1
      }],
      success_url: 'http://localhost:3500/success',
      cancel_url: 'http://localhost:3500/cancel'
    });
  })
  .then((session) => {
    console.log('   ✅ Checkout session created!');
    console.log('   - Session ID:', session.id);
    console.log('   - Checkout URL:', session.url);
    console.log('');
    console.log('🎉 All Stripe tests passed!');
    console.log('');
    console.log('📝 Next steps:');
    console.log('   1. Copy the checkout URL above');
    console.log('   2. Open it in your browser');
    console.log('   3. Use test card: 4242 4242 4242 4242');
    console.log('   4. Any future expiry date');
    console.log('   5. Any 3-digit CVC');
    console.log('   6. Watch the webhook listener for events!');

    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  });

import { sendPriceDropEmail } from './src/services/email.js';

// Test email with fake product data
const testProduct = {
  title: 'Test Product - Sony WH-1000XM4 Headphones',
  url: 'https://amazon.com/test',
  image: 'https://m.media-amazon.com/images/I/71o8Q5XJS5L._AC_SL1500_.jpg',
  oldPrice: 349.99,
  newPrice: 279.99,
  dropPercent: 20
};

console.log('Sending test email...');
console.log('To:', 'matt.mcvey49@gmail.com');

sendPriceDropEmail({
  to: 'matt.mcvey49@gmail.com',
  product: testProduct
})
  .then(() => {
    console.log('✅ Test email sent successfully!');
    console.log('Check your inbox at matt.mcvey49@gmail.com');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed to send test email:', error.message);
    process.exit(1);
  });

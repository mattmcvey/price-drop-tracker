import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter using AWS SES
const transporter = nodemailer.createTransport({
  host: process.env.SES_SMTP_HOST || 'email-smtp.us-east-1.amazonaws.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SES_SMTP_USERNAME,
    pass: process.env.SES_SMTP_PASSWORD
  }
});

// Send price drop alert email
export async function sendPriceDropEmail({ to, product }) {
  try {
    const { title, url, image, oldPrice, newPrice, dropPercent } = product;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .content {
      padding: 30px;
      background: #f9f9f9;
    }
    .product-card {
      background: white;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .product-image {
      max-width: 200px;
      height: auto;
      border-radius: 4px;
    }
    .price-info {
      margin: 20px 0;
    }
    .old-price {
      text-decoration: line-through;
      color: #999;
      font-size: 18px;
    }
    .new-price {
      color: #667eea;
      font-size: 28px;
      font-weight: bold;
    }
    .savings {
      color: #28a745;
      font-size: 20px;
      font-weight: bold;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 15px 30px;
      text-decoration: none;
      border-radius: 5px;
      font-weight: bold;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #999;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>💰 Price Drop Alert!</h1>
    <p>A product you're tracking just dropped in price</p>
  </div>

  <div class="content">
    <div class="product-card">
      ${image ? `<img src="${image}" alt="Product" class="product-image">` : ''}

      <h2>${title}</h2>

      <div class="price-info">
        <div class="old-price">Was: $${oldPrice}</div>
        <div class="new-price">Now: $${newPrice}</div>
        <div class="savings">Save ${dropPercent}%!</div>
      </div>

      <a href="${url}" class="cta-button">View Product →</a>
    </div>

    <p><strong>Act fast!</strong> Prices can change at any time. This deal might not last long.</p>
  </div>

  <div class="footer">
    <p>You're receiving this email because you're tracking this product on PriceDrop.</p>
    <p><a href="${process.env.FRONTEND_URL}/settings">Manage your preferences</a></p>
  </div>
</body>
</html>
    `;

    const textContent = `
Price Drop Alert!

${title}

Was: $${oldPrice}
Now: $${newPrice}
Save ${dropPercent}%!

View Product: ${url}

Act fast! Prices can change at any time.
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@pricedrop.app',
      to,
      subject: `💰 Price Drop: ${title}`,
      text: textContent,
      html: htmlContent
    });

    console.log(`Price drop email sent to ${to}`);
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

// Send welcome email
export async function sendWelcomeEmail(to, name) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@pricedrop.app',
      to,
      subject: 'Welcome to PriceDrop! 🎉',
      html: `
        <h1>Welcome to PriceDrop!</h1>
        <p>Hi ${name || 'there'},</p>
        <p>Thanks for signing up! You can now track prices and get notified when products go on sale.</p>
        <p><strong>Free plan includes:</strong></p>
        <ul>
          <li>Track up to 3 products</li>
          <li>Price alerts via email</li>
          <li>Price history tracking</li>
        </ul>
        <p>Want unlimited tracking? <a href="${process.env.FRONTEND_URL}/upgrade">Upgrade to Pro for $4.99/month</a></p>
        <p>Happy saving!</p>
      `
    });

    console.log(`Welcome email sent to ${to}`);
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }
}

export default { sendPriceDropEmail, sendWelcomeEmail };

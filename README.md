# 💰 PriceDrop - Price Tracker Chrome Extension

**Never miss a deal again!** Track product prices across Amazon, eBay, Walmart, and more. Get instant alerts when prices drop.

## 🎯 Revenue Model

- **Freemium**: 3 products free, $4.99/month for unlimited
- **Affiliate Revenue**: 3-8% commission on purchases through tracked links
- **Target**: $200+/month within 3-4 months

## 🚀 Features

- ✅ Track prices across major e-commerce sites
- ✅ Real-time price drop alerts via email
- ✅ Price history charts
- ✅ Automatic affiliate link integration
- ✅ Freemium model with Stripe payments
- ✅ Automated price checking (every 6 hours)

## 📁 Project Structure

```
price-drop-tracker/
├── extension/           # Chrome extension
│   ├── manifest.json
│   ├── popup/          # Extension UI
│   ├── background/     # Service worker
│   └── content/        # Page scrapers
├── backend/            # Node.js API
│   ├── src/
│   │   ├── routes/     # API endpoints
│   │   ├── services/   # Business logic
│   │   ├── cron/       # Scheduled jobs
│   │   └── config/     # Database config
│   └── schema.sql      # Database schema
```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Stripe account
- SendGrid account (for emails)
- Amazon Associates account (optional, for affiliate revenue)

### 1. Database Setup

```bash
# Create database
createdb pricedrop

# Run schema
psql pricedrop < backend/schema.sql
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your credentials:
# - DATABASE_URL
# - JWT_SECRET
# - STRIPE_SECRET_KEY, STRIPE_PRICE_ID
# - SENDGRID_API_KEY
# - AMAZON_ASSOCIATE_TAG

# Start server
npm run dev
```

Server will run on `http://localhost:3000`

### 3. Chrome Extension Setup

```bash
cd extension

# No build needed - it's vanilla JS!

# Load in Chrome:
# 1. Go to chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the extension/ folder
```

### 4. Stripe Setup

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Create a product: "PriceDrop Pro" - $4.99/month recurring
3. Copy the Price ID to `.env` as `STRIPE_PRICE_ID`
4. Set up webhook endpoint: `https://your-domain.com/api/webhooks/stripe`
5. Add webhook events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
6. Copy webhook secret to `.env` as `STRIPE_WEBHOOK_SECRET`

### 5. Affiliate Setup (Optional but Recommended)

**Amazon Associates:**
1. Sign up at [affiliate-program.amazon.com](https://affiliate-program.amazon.com)
2. Get your Associate Tag
3. Add to `.env` as `AMAZON_ASSOCIATE_TAG`

**eBay Partner Network:**
1. Sign up at [ebaypartnernetwork.com](https://ebaypartnernetwork.com)
2. Get your Campaign ID
3. Add to `.env` as `EBAY_CAMPAIGN_ID`

## 📊 Testing the Extension

1. Navigate to any product page (Amazon, eBay, etc.)
2. Click the PriceDrop extension icon
3. Click "Track This Price"
4. Product will be added to your tracked list
5. Backend will check prices every 6 hours
6. You'll receive email alerts when prices drop

## 🚀 Deployment

### Backend (Heroku/Railway/DigitalOcean)

```bash
# Example: Railway deployment
railway login
railway init
railway add postgresql
railway up

# Set environment variables in Railway dashboard
```

### Extension Publishing

1. Create icons (16x16, 48x48, 128x128) and add to `extension/assets/`
2. Test thoroughly
3. Zip the extension folder
4. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
5. Pay $5 one-time fee
6. Upload ZIP
7. Fill out store listing:
   - Title: "PriceDrop - Price Tracker & Alert"
   - Description: Compelling copy
   - Screenshots: Show tracking in action
   - Category: Shopping
8. Submit for review (typically 1-3 days)

## 💰 Monetization Strategy

### Phase 1: Launch (Week 1-4)
- Publish extension
- Focus on Amazon products (highest commission)
- Post on ProductHunt, Reddit (r/ChromeExtensions, r/Deals)
- Target: 100-500 users

### Phase 2: Growth (Month 2-3)
- Optimize Chrome Store listing with reviews
- Add more e-commerce platforms
- Email campaigns to free users
- Target: 1000+ users, 40-50 paid subscribers ($200/mo)

### Phase 3: Scale (Month 4+)
- Add premium features (price prediction, deal alerts)
- Partner with deal forums/communities
- Affiliate revenue compounds as user base grows
- Target: $500+/month

## 📈 Revenue Projections

**Conservative estimates:**

| Month | Users | Paid Subs | Subscription Revenue | Affiliate Revenue | Total |
|-------|-------|-----------|---------------------|-------------------|-------|
| 1     | 200   | 5         | $25                 | $10               | $35   |
| 2     | 500   | 15        | $75                 | $30               | $105  |
| 3     | 1000  | 40        | $200                | $50               | $250  |
| 6     | 3000  | 120       | $600                | $150              | $750  |

**Conversion rate: 4% free → paid (industry average)**

## 🔧 Maintenance Required

- **Minimal!** Once deployed, it runs automatically
- Cron jobs check prices
- Emails send automatically
- Stripe handles billing
- ~2-5 hours/month to monitor and fix issues

## 🐛 Troubleshooting

**Extension not detecting products:**
- Check content script loaded (inspect page → Console)
- Verify site is supported
- Check selectors in `content.js` - sites change HTML

**Backend not scraping:**
- Puppeteer might be blocked (use residential proxies)
- Add delays between requests
- Rotate user agents

**Emails not sending:**
- Verify SendGrid API key
- Check spam folder
- Verify sender domain

## 📝 TODO Before Launch

- [ ] Create extension icons (use Canva or hire on Fiverr - $5-20)
- [ ] Add privacy policy page (required by Chrome Web Store)
- [ ] Add terms of service
- [ ] Test payment flow end-to-end
- [ ] Set up error monitoring (Sentry)
- [ ] Create demo video for Chrome Store
- [ ] Write compelling store listing copy

## 🎨 Design Assets Needed

- Extension icons (16x16, 48x48, 128x128) - Use [favicon.io](https://favicon.io)
- Chrome Store screenshots (1280x800 or 640x400)
- Promotional images (440x280)

## 📚 Resources

- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- [Stripe Subscriptions Guide](https://stripe.com/docs/billing/subscriptions)
- [Amazon Associates](https://affiliate-program.amazon.com/)
- [SendGrid Email API](https://docs.sendgrid.com/)

## 🤝 Support

For issues or questions, open an issue or contact support.

---

**Let's make some passive income! 🚀💰**

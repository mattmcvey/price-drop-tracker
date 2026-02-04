# 🚀 Quick Start Guide

Get PriceDrop running locally in 10 minutes!

## Step 1: Database (2 minutes)

```bash
# Install PostgreSQL if you don't have it
brew install postgresql  # macOS
# or: sudo apt-get install postgresql  # Linux

# Start PostgreSQL
brew services start postgresql  # macOS
# or: sudo service postgresql start  # Linux

# Create database
createdb pricedrop

# Load schema
psql pricedrop < backend/schema.sql
```

## Step 2: Backend (3 minutes)

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://localhost:5432/pricedrop
JWT_SECRET=$(openssl rand -base64 32)
SENDGRID_API_KEY=your-key-here
EMAIL_FROM=noreply@pricedrop.test
STRIPE_SECRET_KEY=sk_test_your-key
STRIPE_PRICE_ID=price_your-price-id
STRIPE_WEBHOOK_SECRET=whsec_your-secret
FRONTEND_URL=chrome-extension://your-extension-id
AMAZON_ASSOCIATE_TAG=your-tag
EOF

# Start server
npm run dev
```

Server running at http://localhost:3000 ✅

## Step 3: Load Extension (2 minutes)

1. Open Chrome
2. Go to `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the `extension/` folder
6. Extension loaded! ✅

## Step 4: Test It! (3 minutes)

1. Go to any Amazon product page
2. Click the PriceDrop extension icon
3. Click "Track This Price"
4. Open backend logs - you should see API call
5. Check database: `psql pricedrop -c "SELECT * FROM products;"`

## 🎉 Done!

You now have:
- ✅ Working Chrome extension
- ✅ Backend API running
- ✅ Database tracking products
- ✅ Cron jobs scheduled

## What's Next?

### To Actually Make Money:

1. **Get API Keys** (30 mins)
   - [Stripe](https://stripe.com) → Create product, get keys
   - [SendGrid](https://sendgrid.com) → Free tier, get API key
   - [Amazon Associates](https://affiliate-program.amazon.com) → Get associate tag

2. **Deploy Backend** (1 hour)
   ```bash
   # Option 1: Railway (easiest)
   npm i -g @railway/cli
   railway login
   railway init
   railway add postgresql
   railway up

   # Option 2: Heroku
   heroku create pricedrop-api
   heroku addons:create heroku-postgresql:mini
   git push heroku main

   # Option 3: DigitalOcean App Platform
   # Push to GitHub, connect in DO dashboard
   ```

3. **Update Extension** (5 mins)
   - Change API_URL in extension files to your deployed URL
   - Update FRONTEND_URL in backend .env to your extension ID

4. **Create Icons** (15 mins)
   - Go to [favicon.io](https://favicon.io/favicon-generator/)
   - Generate icons
   - Download and add to `extension/assets/`

5. **Publish Extension** (1 hour)
   - Zip extension folder
   - Go to [Chrome Web Store Dashboard](https://chrome.google.com/webstore/devconsole)
   - Pay $5 fee (one-time)
   - Upload and submit

6. **Launch** (1 day)
   - Post on ProductHunt
   - Post on Reddit: r/ChromeExtensions, r/Deals, r/Frugal
   - Post on Twitter/X with hashtags #deals #shopping
   - Share in deal forums

## 🐛 Troubleshooting

**Database connection error:**
```bash
# Check PostgreSQL is running
ps aux | grep postgres

# Check you can connect
psql pricedrop
```

**Extension not loading:**
- Check for errors in Chrome extension page
- Look at Console in extension popup (right-click → Inspect)

**Puppeteer errors:**
```bash
# Install system dependencies (Linux)
sudo apt-get install -y chromium-browser

# macOS should work out of the box
```

**"Cannot find module" errors:**
```bash
# Make sure you're in backend/ directory
cd backend
npm install
```

## 💡 Tips

- Start with just Amazon - it has the best affiliate rates
- Post your extension in deal communities early
- Ask early users for 5-star reviews
- Free tier is fine for first 100 users
- Monitor scraping errors - sites change their HTML

## 📊 Tracking Progress

Check your stats:
```bash
# User count
psql pricedrop -c "SELECT COUNT(*) FROM users;"

# Premium users
psql pricedrop -c "SELECT COUNT(*) FROM users WHERE is_premium = true;"

# Tracked products
psql pricedrop -c "SELECT COUNT(*) FROM products;"

# Price drops detected
psql pricedrop -c "SELECT COUNT(*) FROM price_alerts WHERE sent_at > NOW() - INTERVAL '7 days';"
```

## 🎯 First Revenue Goal: $200/month

You need:
- 40 paid users at $4.99/month = $199.60
- Or 30 paid + affiliate revenue

At 4% conversion rate:
- 1000 total users → 40 paid users

**Timeline:**
- Week 1-2: Get to 100 users
- Week 3-4: Get to 500 users
- Month 2: Get to 1000 users → Hit $200/month!

You can do this! 🚀

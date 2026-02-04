// Product detection for various e-commerce sites

// Selectors for different platforms
const SELECTORS = {
  amazon: {
    title: '#productTitle, #title',
    price: '.a-price .a-offscreen, #priceblock_ourprice, #priceblock_dealprice, .a-price-whole',
    image: '#landingImage, #imgBlkFront',
    store: 'Amazon'
  },
  ebay: {
    title: '.x-item-title__mainTitle, h1.it-ttl',
    price: '.x-price-primary .ux-textspans, #prcIsum',
    image: '.ux-image-carousel-item img, #icImg',
    store: 'eBay'
  },
  walmart: {
    title: 'h1[itemprop="name"]',
    price: '[itemprop="price"], .price-characteristic',
    image: '.prod-hero-image img',
    store: 'Walmart'
  },
  target: {
    title: 'h1[data-test="product-title"]',
    price: '[data-test="product-price"]',
    image: 'picture img[data-test="product-image"]',
    store: 'Target'
  },
  bestbuy: {
    title: '.sku-title h1',
    price: '.priceView-customer-price span',
    image: '.primary-image',
    store: 'Best Buy'
  },
  // Generic fallback
  generic: {
    title: 'h1, [itemprop="name"]',
    price: '[itemprop="price"], .price, .product-price',
    image: '[itemprop="image"], .product-image img, img[alt*="product"]',
    store: 'Online Store'
  }
};

// Detect which platform we're on
function detectPlatform() {
  const hostname = window.location.hostname.toLowerCase();

  if (hostname.includes('amazon')) return 'amazon';
  if (hostname.includes('ebay')) return 'ebay';
  if (hostname.includes('walmart')) return 'walmart';
  if (hostname.includes('target')) return 'target';
  if (hostname.includes('bestbuy')) return 'bestbuy';

  return 'generic';
}

// Extract text from element
function extractText(selector) {
  const element = document.querySelector(selector);
  return element ? element.textContent.trim() : null;
}

// Extract attribute from element
function extractAttribute(selector, attribute = 'src') {
  const element = document.querySelector(selector);
  return element ? element.getAttribute(attribute) : null;
}

// Clean price string
function cleanPrice(priceStr) {
  if (!priceStr) return null;

  // Remove non-numeric characters except decimal point
  const cleaned = priceStr.replace(/[^0-9.]/g, '');
  const price = parseFloat(cleaned);

  return isNaN(price) ? null : `$${price.toFixed(2)}`;
}

// Extract product information
function extractProductInfo() {
  const platform = detectPlatform();
  const selectors = SELECTORS[platform];

  // Try multiple selectors for title
  let title = null;
  for (const selector of selectors.title.split(', ')) {
    title = extractText(selector);
    if (title) break;
  }

  // Try multiple selectors for price
  let priceStr = null;
  for (const selector of selectors.price.split(', ')) {
    priceStr = extractText(selector);
    if (priceStr) break;
  }
  const price = cleanPrice(priceStr);

  // Try multiple selectors for image
  let image = null;
  for (const selector of selectors.image.split(', ')) {
    image = extractAttribute(selector, 'src');
    if (image) break;
  }

  // If we don't have at least title and price, it's not a valid product page
  if (!title || !price) {
    return null;
  }

  return {
    title: title.substring(0, 200), // Limit title length
    price,
    image: image || null,
    url: window.location.href,
    store: selectors.store,
    platform,
    scrapedAt: Date.now()
  };
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getProductInfo') {
    const product = extractProductInfo();
    sendResponse({ product });
  }
});

// Notify extension when product page is detected
function notifyProductDetected() {
  const product = extractProductInfo();
  if (product) {
    chrome.runtime.sendMessage({
      action: 'productDetected',
      product
    });
  }
}

// Check for product when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', notifyProductDetected);
} else {
  notifyProductDetected();
}

// Also check when URL changes (for SPAs)
let lastUrl = window.location.href;
new MutationObserver(() => {
  const url = window.location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    setTimeout(notifyProductDetected, 1000); // Wait for content to load
  }
}).observe(document, { subtree: true, childList: true });

// API Configuration
const API_URL = 'https://price-drop-tracker-production.up.railway.app/api';

// DOM Elements
const authBtn = document.getElementById('auth-btn');
const userEmail = document.getElementById('user-email');
const currentProductSection = document.getElementById('current-product');
const notProductSection = document.getElementById('not-product');
const trackBtn = document.getElementById('track-btn');
const productsList = document.getElementById('products-list');
const trackedCount = document.getElementById('tracked-count');
const upgradePrompt = document.getElementById('upgrade-prompt');
const upgradeBtn = document.getElementById('upgrade-btn');

// State
let currentUser = null;
let currentProduct = null;
let trackedProducts = [];

// Initialize popup
async function init() {
  // Load user from storage
  const result = await chrome.storage.local.get(['user', 'trackedProducts']);
  currentUser = result.user || null;
  trackedProducts = result.trackedProducts || [];

  updateUI();

  // Request product info from current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { action: 'getProductInfo' }, (response) => {
    if (chrome.runtime.lastError) {
      console.log('Content script not ready');
      return;
    }
    if (response && response.product) {
      currentProduct = response.product;
      displayCurrentProduct();
    }
  });
}

// Update UI based on state
function updateUI() {
  if (currentUser) {
    authBtn.textContent = 'Sign Out';
    userEmail.textContent = currentUser.email;
    userEmail.classList.remove('hidden');
  } else {
    authBtn.textContent = 'Sign In';
    userEmail.classList.add('hidden');
  }

  displayTrackedProducts();
}

// Display current product
function displayCurrentProduct() {
  if (!currentProduct) {
    currentProductSection.classList.add('hidden');
    notProductSection.classList.remove('hidden');
    return;
  }

  currentProductSection.classList.remove('hidden');
  notProductSection.classList.add('hidden');

  document.getElementById('product-image').src = currentProduct.image || 'assets/placeholder.png';
  document.getElementById('product-title').textContent = currentProduct.title;
  document.getElementById('product-price').textContent = currentProduct.price;
  document.getElementById('product-store').textContent = currentProduct.store;

  // Check if already tracked
  const isTracked = trackedProducts.some(p => p.url === currentProduct.url);
  if (isTracked) {
    trackBtn.textContent = '✓ Already Tracking';
    trackBtn.disabled = true;
  }
}

// Display tracked products
function displayTrackedProducts() {
  trackedCount.textContent = trackedProducts.length;
  productsList.innerHTML = '';

  if (trackedProducts.length === 0) {
    productsList.innerHTML = '<p class="info-text">No products tracked yet</p>';
    return;
  }

  trackedProducts.forEach((product, index) => {
    const item = document.createElement('div');
    item.className = 'tracked-item';
    item.innerHTML = `
      <img src="${product.image || 'assets/placeholder.png'}" alt="${product.title}">
      <div class="tracked-item-info">
        <div class="tracked-item-title">${product.title}</div>
        <div class="tracked-item-price">${product.price}</div>
        <div class="tracked-item-store">${product.store}</div>
      </div>
      <button class="remove-btn" data-index="${index}">×</button>
    `;
    productsList.appendChild(item);
  });

  // Show upgrade prompt if at free limit
  const FREE_LIMIT = 3;
  if (!currentUser?.isPremium && trackedProducts.length >= FREE_LIMIT) {
    upgradePrompt.classList.remove('hidden');
    if (currentProduct && !trackedProducts.some(p => p.url === currentProduct.url)) {
      trackBtn.disabled = true;
      trackBtn.textContent = '⚠️ Limit Reached - Upgrade to Track More';
    }
  } else {
    upgradePrompt.classList.add('hidden');
  }

  // Attach remove handlers
  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      removeProduct(index);
    });
  });
}

// Track current product
async function trackProduct() {
  if (!currentProduct) return;

  // Check limits
  const FREE_LIMIT = 3;
  if (!currentUser?.isPremium && trackedProducts.length >= FREE_LIMIT) {
    alert('You\'ve reached the free limit of 3 products. Upgrade to Pro for unlimited tracking!');
    return;
  }

  // Add to tracked products
  trackedProducts.push({
    ...currentProduct,
    addedAt: Date.now(),
    initialPrice: currentProduct.price
  });

  // Save to storage
  await chrome.storage.local.set({ trackedProducts });

  // Send to backend if user is logged in
  if (currentUser) {
    try {
      await fetch(`${API_URL}/products/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`
        },
        body: JSON.stringify(currentProduct)
      });
    } catch (error) {
      console.error('Failed to sync with server:', error);
    }
  }

  trackBtn.textContent = '✓ Tracking!';
  trackBtn.disabled = true;

  updateUI();
}

// Remove product from tracking
async function removeProduct(index) {
  const product = trackedProducts[index];
  trackedProducts.splice(index, 1);

  await chrome.storage.local.set({ trackedProducts });

  // Send to backend
  if (currentUser && product.id) {
    try {
      await fetch(`${API_URL}/products/${product.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${currentUser.token}`
        }
      });
    } catch (error) {
      console.error('Failed to sync with server:', error);
    }
  }

  updateUI();

  // Re-enable track button if we were at limit
  if (currentProduct && trackBtn.disabled) {
    trackBtn.disabled = false;
    trackBtn.textContent = '📊 Track This Price';
  }
}

// Auth handler
async function handleAuth() {
  if (currentUser) {
    // Sign out
    currentUser = null;
    await chrome.storage.local.remove('user');
    updateUI();
  } else {
    // Sign in - open auth page
    chrome.tabs.create({ url: `${API_URL.replace('/api', '')}/auth` });
  }
}

// Upgrade handler
function handleUpgrade() {
  if (currentUser) {
    chrome.tabs.create({ url: `${API_URL.replace('/api', '')}/upgrade` });
  } else {
    alert('Please sign in first to upgrade to Pro!');
  }
}

// Event Listeners
authBtn.addEventListener('click', handleAuth);
trackBtn.addEventListener('click', trackProduct);
upgradeBtn.addEventListener('click', handleUpgrade);

// Listen for auth messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'authSuccess') {
    currentUser = message.user;
    chrome.storage.local.set({ user: currentUser });
    updateUI();
  }
});

// Initialize
init();

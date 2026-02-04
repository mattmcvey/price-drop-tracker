// Background service worker for PriceDrop extension

const API_URL = 'http://localhost:3500/api';

// Install event
chrome.runtime.onInstalled.addListener(() => {
  console.log('PriceDrop extension installed');

  // Set up periodic alarm for price checking (every 6 hours)
  chrome.alarms.create('checkPrices', {
    periodInMinutes: 360 // 6 hours
  });
});

// Listen for alarms
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkPrices') {
    checkAllPrices();
  }
});

// Check all tracked products for price changes
async function checkAllPrices() {
  const { user, trackedProducts } = await chrome.storage.local.get(['user', 'trackedProducts']);

  if (!trackedProducts || trackedProducts.length === 0) {
    return;
  }

  console.log(`Checking prices for ${trackedProducts.length} products`);

  // If user is logged in, let backend handle it
  if (user?.token) {
    try {
      const response = await fetch(`${API_URL}/products/check`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      const data = await response.json();

      // Show notifications for price drops
      if (data.priceDrops) {
        data.priceDrops.forEach(drop => {
          showPriceDropNotification(drop);
        });
      }
    } catch (error) {
      console.error('Failed to check prices:', error);
    }
  }
}

// Show notification for price drop
function showPriceDropNotification(product) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: product.image || 'assets/icon128.png',
    title: '💰 Price Drop Alert!',
    message: `${product.title} dropped to ${product.newPrice}! (was ${product.oldPrice})`,
    priority: 2,
    buttons: [
      { title: 'View Product' }
    ]
  }, (notificationId) => {
    // Store product URL for notification click
    chrome.storage.local.set({
      [`notification_${notificationId}`]: product.url
    });
  });
}

// Handle notification clicks
chrome.notifications.onClicked.addListener(async (notificationId) => {
  const result = await chrome.storage.local.get(`notification_${notificationId}`);
  const url = result[`notification_${notificationId}`];

  if (url) {
    chrome.tabs.create({ url });
    chrome.storage.local.remove(`notification_${notificationId}`);
  }
});

chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
  if (buttonIndex === 0) { // View Product button
    const result = await chrome.storage.local.get(`notification_${notificationId}`);
    const url = result[`notification_${notificationId}`];

    if (url) {
      chrome.tabs.create({ url });
      chrome.storage.local.remove(`notification_${notificationId}`);
    }
  }
});

// Listen for product detection from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'productDetected') {
    // Could show badge or notification
    chrome.action.setBadgeText({ text: '👀', tabId: sender.tab.id });
    chrome.action.setBadgeBackgroundColor({ color: '#667eea', tabId: sender.tab.id });
  }
});

// Handle auth success from auth page
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  if (message.action === 'authSuccess') {
    chrome.storage.local.set({ user: message.user });

    // Notify all extension pages
    chrome.runtime.sendMessage({
      action: 'authSuccess',
      user: message.user
    });
  }
});

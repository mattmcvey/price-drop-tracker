import dotenv from 'dotenv';

dotenv.config();

// Add affiliate tags to product URLs
export function addAffiliateLink(url, platform) {
  try {
    const urlObj = new URL(url);

    switch (platform) {
      case 'amazon':
        // Add Amazon Associate tag
        if (process.env.AMAZON_ASSOCIATE_TAG) {
          urlObj.searchParams.set('tag', process.env.AMAZON_ASSOCIATE_TAG);
        }
        break;

      case 'ebay':
        // Add eBay Partner Network campaign ID
        if (process.env.EBAY_CAMPAIGN_ID) {
          urlObj.searchParams.set('mkcid', '1');
          urlObj.searchParams.set('mkrid', '711-53200-19255-0');
          urlObj.searchParams.set('campid', process.env.EBAY_CAMPAIGN_ID);
        }
        break;

      case 'walmart':
        // Walmart affiliate links
        if (process.env.WALMART_PUBLISHER_ID) {
          urlObj.searchParams.set('wmlspartner', process.env.WALMART_PUBLISHER_ID);
        }
        break;

      default:
        // Return original URL for unsupported platforms
        return url;
    }

    return urlObj.toString();
  } catch (error) {
    console.error('Error adding affiliate link:', error);
    return url; // Return original URL on error
  }
}

// Track affiliate click (for analytics)
export async function trackAffiliateClick(productId, userId, platform) {
  try {
    // You could store this in a database for analytics
    console.log(`Affiliate click: user=${userId}, product=${productId}, platform=${platform}`);

    // Future: Send to analytics service
    // await analytics.track('affiliate_click', { productId, userId, platform });

    return true;
  } catch (error) {
    console.error('Error tracking affiliate click:', error);
    return false;
  }
}

// Calculate estimated commission (for internal metrics)
export function estimateCommission(price, platform) {
  const rates = {
    amazon: 0.04, // 4% average for Amazon Associates
    ebay: 0.03, // 3% for eBay Partner Network
    walmart: 0.04, // 4% for Walmart Affiliates
    target: 0.01, // 1% for Target
    bestbuy: 0.01 // 1% for Best Buy
  };

  const rate = rates[platform] || 0;
  return price * rate;
}

export default { addAffiliateLink, trackAffiliateClick, estimateCommission };

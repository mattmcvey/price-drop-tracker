const {join} = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Skip downloading Chrome in CI environments like Railway
  skipDownload: process.env.NODE_ENV === 'production',

  // Set custom cache directory
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};

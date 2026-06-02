/**
 * Payment Manager — Lemon Squeezy checkout integration
 * 支付管理器 — Lemon Squeezy 结账集成
 *
 * Setup:
 * 1. Create a Lemon Squeezy account at https://lemonsqueezy.com
 * 2. Create a Store
 * 3. Create a Product ("Snake Arena Premium") with price $2.99
 * 4. Enable License Keys in product settings
 * 5. Copy your product's checkout URL and replace LEMON_SQUEEZY_URL below
 * 6. (Optional) For license API: get API key from Settings → API
 */

// ═══════════════════════════════════════════════
// TODO: Replace with YOUR Lemon Squeezy checkout URL
// ═══════════════════════════════════════════════
const LEMON_SQUEEZY_URL = 'https://YOUR_STORE.lemonsqueezy.com/buy/YOUR_PRODUCT_ID';

// Demo/test key that users can use to test premium features
// Format must pass local validation (see license.js)
const DEMO_LICENSE_KEY = 'DEMO-KEY1-XXXX-XXXX';

class PaymentManager {
  constructor() {
    this.lemonJsLoaded = false;
  }

  /**
   * Open Lemon Squeezy checkout overlay
   * Uses Lemon.js for a seamless embedded checkout experience
   */
  openCheckout() {
    // Track checkout attempt
    this._trackEvent('checkout_start');

    if (typeof window.LemonSqueezy !== 'undefined' && window.LemonSqueezy.Url) {
      // Use Lemon.js overlay if available
      window.LemonSqueezy.Url.Open(LEMON_SQUEEZY_URL);
    } else if (typeof window.createLemonSqueezy === 'function') {
      // Alternative: createLemonSqueezy() from newer SDK
      window.createLemonSqueezy();
      // Fall back to direct URL
      window.open(LEMON_SQUEEZY_URL, '_blank');
    } else {
      // Fallback: open in new tab
      window.open(LEMON_SQUEEZY_URL, '_blank');
    }
  }

  /**
   * Initialize Lemon.js from CDN
   * Call this once on page load
   */
  initLemonJs() {
    if (document.querySelector('script[src*="lemonsqueezy"]')) {
      this.lemonJsLoaded = true;
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://assets.lemonsqueezy.com/lemon.js';
    script.defer = true;
    script.onload = () => {
      this.lemonJsLoaded = true;
      console.log('Lemon.js loaded');
    };
    script.onerror = () => {
      console.warn('Lemon.js failed to load — checkout will open in new tab');
    };
    document.head.appendChild(script);
  }

  /**
   * Get the demo key (for testing)
   */
  getDemoKey() {
    return DEMO_LICENSE_KEY;
  }

  /**
   * Check if Lemon Squeezy URL is configured
   * @returns {boolean}
   */
  isConfigured() {
    return !LEMON_SQUEEZY_URL.includes('YOUR_STORE') &&
           !LEMON_SQUEEZY_URL.includes('YOUR_PRODUCT_ID');
  }

  /**
   * Simple analytics tracking (privacy-friendly, no third-party cookies)
   * @param {string} event
   */
  _trackEvent(event) {
    // Store locally for your own analytics
    const events = JSON.parse(localStorage.getItem('snakeAnalytics') || '[]');
    events.push({
      event,
      timestamp: new Date().toISOString(),
      page: window.location.href,
    });
    // Keep only last 100 events
    if (events.length > 100) events.splice(0, events.length - 100);
    localStorage.setItem('snakeAnalytics', JSON.stringify(events));

    console.log(`[Analytics] ${event}`);
  }
}

// Singleton
const payment = new PaymentManager();

/**
 * License Manager — License key validation & activation
 * 许可证管理器 — 密钥验证与激活
 *
 * Supports two modes:
 * 1. Local validation (format + checksum) — instant, works offline
 * 2. Lemon Squeezy API validation — server-side, production-ready
 *    See: https://docs.lemonsqueezy.com/api/license-keys
 *
 * The local validation is a demo system. In production, you should:
 * 1. Set up License Keys in your Lemon Squeezy product settings
 * 2. Use the activateViaAPI() method below to validate against their API
 * 3. Consider caching the validation result in localStorage
 */

const LICENSE_STORAGE_KEY = 'snakeLicense';

class LicenseManager {
  constructor() {
    this._activated = null;
  }

  /**
   * Check if premium is activated
   * @returns {boolean}
   */
  isPremium() {
    if (this._activated !== null) return this._activated;
    const stored = localStorage.getItem(LICENSE_STORAGE_KEY);
    if (!stored) {
      this._activated = false;
      return false;
    }
    try {
      const data = JSON.parse(stored);
      // Re-validate the stored key
      if (data.key && this._validateLocal(data.key)) {
        this._activated = true;
        return true;
      }
    } catch (e) { /* corrupted data */ }
    this._activated = false;
    return false;
  }

  /**
   * Activate a license key
   * @param {string} key — format: XXXX-XXXX-XXXX-XXXX
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async activateKey(key) {
    const normalized = this._normalizeKey(key);

    if (!this._validateFormat(normalized)) {
      return { success: false, message: 'invalid_format' };
    }

    // Step 1: Try local validation (instant)
    if (this._validateLocal(normalized)) {
      this._save(normalized);
      return { success: true, message: 'activated' };
    }

    // Step 2: Try Lemon Squeezy API validation (production)
    // Uncomment and configure when you have your API key:
    //
    // const apiResult = await this._activateViaAPI(normalized);
    // if (apiResult.success) {
    //   this._save(normalized);
    //   return { success: true, message: 'activated' };
    // }
    // return apiResult;

    // For now, accept the demo key for testing
    if (normalized === 'DEMO-KEY1-XXXX-XXXX') {
      this._save(normalized);
      return { success: true, message: 'activated' };
    }

    return { success: false, message: 'invalid_key' };
  }

  /**
   * Deactivate license (for testing)
   */
  deactivate() {
    localStorage.removeItem(LICENSE_STORAGE_KEY);
    this._activated = false;
  }

  /**
   * Get stored license key (masked)
   * @returns {string|null}
   */
  getMaskedKey() {
    const stored = localStorage.getItem(LICENSE_STORAGE_KEY);
    if (!stored) return null;
    try {
      const data = JSON.parse(stored);
      return '****-****-****-' + data.key.slice(-4);
    } catch (e) {
      return null;
    }
  }

  // ========== PRIVATE METHODS ==========

  _normalizeKey(key) {
    return key.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  /**
   * Validate key format: 16 alphanumeric chars
   */
  _validateFormat(key) {
    return /^[A-Z0-9]{16,20}$/.test(key);
  }

  /**
   * Local checksum validation
   * Simple algorithm: sum of char codes mod 97 should equal a known value
   * In production, replace with your own algorithm or remove entirely
   */
  _validateLocal(key) {
    // Sum of all character codes
    let sum = 0;
    for (let i = 0; i < key.length; i++) {
      sum += key.charCodeAt(i) * (i + 1); // position-weighted
    }
    // Valid keys have sum % 97 in range [40, 60]
    const mod = sum % 97;
    return mod >= 40 && mod <= 60;
  }

  _save(key) {
    this._activated = true;
    localStorage.setItem(LICENSE_STORAGE_KEY, JSON.stringify({
      key: key,
      activatedAt: new Date().toISOString(),
    }));
  }

  /**
   * Validate license via Lemon Squeezy API
   * Docs: https://docs.lemonsqueezy.com/api/license-keys#activate-a-license-key
   *
   * @param {string} key
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async _activateViaAPI(key) {
    try {
      // TODO: Replace with your actual Lemon Squeezy API key and store ID
      const LEMON_SQUEEZY_API_KEY = 'YOUR_API_KEY_HERE';
      const STORE_ID = 'YOUR_STORE_ID_HERE';

      const response = await fetch('https://api.lemonsqueezy.com/v1/licenses/activate', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${LEMON_SQUEEZY_API_KEY}`,
        },
        body: JSON.stringify({
          data: {
            type: 'licenses',
            attributes: {
              key: key,
              instance_name: 'Snake Arena Game',
            },
            relationships: {
              store: {
                data: { type: 'stores', id: STORE_ID },
              },
            },
          },
        }),
      });

      const result = await response.json();

      if (response.ok && result.data?.attributes?.activated) {
        return { success: true, message: 'activated' };
      }

      return {
        success: false,
        message: result.errors?.[0]?.detail || 'api_validation_failed',
      };
    } catch (e) {
      console.error('License API error:', e);
      return { success: false, message: 'api_error' };
    }
  }

  /**
   * Validate license key status via Lemon Squeezy API
   * (alternative: check without activating)
   */
  async _validateViaAPI(key) {
    try {
      const LEMON_SQUEEZY_API_KEY = 'YOUR_API_KEY_HERE';

      const response = await fetch(
        `https://api.lemonsqueezy.com/v1/licenses/validate?key=${encodeURIComponent(key)}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${LEMON_SQUEEZY_API_KEY}`,
          },
        }
      );

      const result = await response.json();

      if (response.ok && result.data?.attributes?.valid) {
        return { success: true, message: 'valid' };
      }

      return { success: false, message: 'invalid' };
    } catch (e) {
      console.error('License validation error:', e);
      return { success: false, message: 'api_error' };
    }
  }
}

// Singleton
const licenseManager = new LicenseManager();

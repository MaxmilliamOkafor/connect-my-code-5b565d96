/**
 * ==== USAGE BYPASS ====
 * Removes client-side usage limitations, quotas, and paywall restrictions.
 * 
 * MODIFICATIONS:
 * - Usage counters are bypassed
 * - Subscription tier checks return premium
 * - Paywall/upgrade prompts are hidden
 * - Feature gates are disabled
 */

window.FrogHireUsageBypass = (function() {
  'use strict';

  // ========================================
  // CONFIGURATION
  // ========================================
  const USAGE_STORAGE_KEYS = [
    'usage_count', 'usageCount', 'daily_usage', 'dailyUsage',
    'applications_today', 'applicationsToday', 'app_count',
    'resume_count', 'resumeCount', 'cover_letter_count',
    'autofill_count', 'autofillCount', 'feature_usage',
    'monthly_usage', 'weeklyUsage', 'quota', 'limit',
    'subscription_tier', 'subscriptionTier', 'user_tier',
    'is_premium', 'isPremium', 'is_pro', 'isPro',
    'trial_count', 'trialCount', 'free_tier_limit'
  ];

  const PAYWALL_SELECTORS = [
    '[class*="paywall"]', '[class*="upgrade"]', '[class*="premium-gate"]',
    '[class*="subscription-modal"]', '[class*="limit-reached"]',
    '[class*="quota-exceeded"]', '[class*="usage-limit"]',
    '[data-testid*="paywall"]', '[data-testid*="upgrade"]',
    '.upgrade-prompt', '.premium-only', '.locked-feature',
    '[class*="pro-feature"]', '[class*="locked"]'
  ];

  const LIMIT_MESSAGE_PATTERNS = [
    /limit reached/i, /quota exceeded/i, /upgrade.*premium/i,
    /unlock.*feature/i, /subscribe.*continue/i, /trial.*ended/i,
    /free tier.*limit/i, /daily limit/i, /usage limit/i,
    /maximum.*applications/i, /pro feature/i, /premium only/i
  ];

  let initialized = false;

  /**
   * Override storage to bypass usage tracking
   */
  function overrideStorage() {
    const originalSetItem = Storage.prototype.setItem;
    const originalGetItem = Storage.prototype.getItem;
    
    // Intercept setItem - prevent usage counters from being saved
    Storage.prototype.setItem = function(key, value) {
      const keyLower = key.toLowerCase();
      
      // Skip saving usage/limit data
      if (USAGE_STORAGE_KEYS.some(k => keyLower.includes(k.toLowerCase()))) {
        console.log(`[FrogHire] Blocked usage storage: ${key}`);
        return;
      }
      
      return originalSetItem.call(this, key, value);
    };
    
    // Intercept getItem - return bypassed values
    Storage.prototype.getItem = function(key) {
      const keyLower = key.toLowerCase();
      const value = originalGetItem.call(this, key);
      
      // Return premium/unlimited for tier checks
      if (keyLower.includes('tier') || keyLower.includes('subscription') || keyLower.includes('plan')) {
        try {
          const data = JSON.parse(value);
          return JSON.stringify({ ...data, tier: 'premium', plan: 'unlimited', isPremium: true });
        } catch (e) {
          return 'premium';
        }
      }
      
      // Return 0 for usage counts
      if (keyLower.includes('usage') || keyLower.includes('count') || keyLower.includes('quota')) {
        try {
          const data = JSON.parse(value);
          if (typeof data === 'object') {
            return JSON.stringify({ ...data, count: 0, used: 0, remaining: 999999 });
          }
        } catch (e) {}
        return '0';
      }
      
      // Return true for premium flags
      if (keyLower.includes('premium') || keyLower.includes('pro') || keyLower.includes('paid')) {
        return 'true';
      }
      
      // Return high limit for limit keys
      if (keyLower.includes('limit')) {
        return '999999';
      }
      
      return value;
    };
  }

  /**
   * Intercept fetch to modify usage/subscription responses
   */
  function interceptFetch() {
    const originalFetch = window.fetch;
    
    window.fetch = async function(...args) {
      const response = await originalFetch.apply(this, args);
      const url = args[0]?.url || args[0];
      
      // Check if this is a usage/subscription endpoint
      if (typeof url === 'string' && 
          (url.includes('usage') || url.includes('subscription') || 
           url.includes('quota') || url.includes('limit') || 
           url.includes('billing') || url.includes('tier'))) {
        
        try {
          const clone = response.clone();
          const data = await clone.json();
          
          // Modify response to show unlimited/premium
          const modifiedData = {
            ...data,
            usage: { count: 0, limit: 999999, remaining: 999999 },
            subscription: { tier: 'premium', plan: 'unlimited', active: true },
            quota: { used: 0, total: 999999 },
            isPremium: true,
            isUnlimited: true,
            canUse: true,
            allowed: true,
            limitReached: false
          };
          
          console.log('[FrogHire] Modified usage response to unlimited');
          
          return new Response(JSON.stringify(modifiedData), {
            status: 200,
            headers: response.headers
          });
        } catch (e) {
          // Not JSON, return original
        }
      }
      
      return response;
    };
  }

  /**
   * Hide paywall and upgrade prompts
   */
  function hidePaywalls() {
    // Initial hide
    const hideElements = () => {
      PAYWALL_SELECTORS.forEach(selector => {
        try {
          document.querySelectorAll(selector).forEach(el => {
            el.style.display = 'none';
            el.style.visibility = 'hidden';
            el.style.opacity = '0';
            el.style.pointerEvents = 'none';
          });
        } catch (e) {}
      });
    };
    
    hideElements();
    
    // Watch for dynamically added paywalls
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if this node is a paywall
            const isPaywall = PAYWALL_SELECTORS.some(selector => {
              try {
                return node.matches && node.matches(selector);
              } catch (e) {
                return false;
              }
            });
            
            if (isPaywall) {
              node.style.display = 'none';
              console.log('[FrogHire] Hidden paywall element');
            }
            
            // Check for limit messages in text content
            if (node.textContent && LIMIT_MESSAGE_PATTERNS.some(p => p.test(node.textContent))) {
              // Don't hide entire element, just neutralize blocking behavior
              const buttons = node.querySelectorAll('button');
              buttons.forEach(btn => {
                if (btn.disabled) {
                  btn.disabled = false;
                }
              });
            }
            
            // Hide any child paywall elements
            if (node.querySelectorAll) {
              hideElements();
            }
          }
        }
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Enable disabled buttons and features
   */
  function enableDisabledFeatures() {
    const enableButtons = () => {
      // Find and enable disabled buttons
      document.querySelectorAll('button[disabled], input[disabled], [aria-disabled="true"]').forEach(el => {
        // Check if it's a feature button (not a form validation button)
        const text = (el.textContent || '').toLowerCase();
        const classList = el.className.toLowerCase();
        
        if (text.includes('apply') || text.includes('autofill') || 
            text.includes('generate') || text.includes('resume') ||
            text.includes('cover') || classList.includes('feature') ||
            classList.includes('action')) {
          el.disabled = false;
          el.removeAttribute('disabled');
          el.setAttribute('aria-disabled', 'false');
          el.style.pointerEvents = 'auto';
          el.style.opacity = '1';
        }
      });
    };
    
    enableButtons();
    
    // Watch for newly disabled buttons
    const observer = new MutationObserver(() => {
      enableButtons();
    });
    
    observer.observe(document.body, {
      attributes: true,
      subtree: true,
      attributeFilter: ['disabled', 'aria-disabled']
    });
  }

  /**
   * Override global functions that check limits
   */
  function overrideGlobalFunctions() {
    // Common function names for limit checking
    const functionNames = [
      'checkUsageLimit', 'checkQuota', 'isLimitReached',
      'canUseFeature', 'hasReachedLimit', 'isQuotaExceeded',
      'checkSubscription', 'isPremiumFeature', 'requiresUpgrade'
    ];
    
    functionNames.forEach(name => {
      if (typeof window[name] === 'function') {
        const original = window[name];
        window[name] = function(...args) {
          console.log(`[FrogHire] Bypassed limit check: ${name}`);
          // Return values that indicate no limit
          return name.startsWith('is') || name.startsWith('has') || name.startsWith('requires') 
            ? false 
            : true;
        };
      }
    });
  }

  /**
   * Initialize all usage bypass mechanisms
   */
  function initialize() {
    if (initialized) return;
    
    console.log('[FrogHire] Initializing usage bypass - unlimited access enabled');
    
    overrideStorage();
    interceptFetch();
    hidePaywalls();
    enableDisabledFeatures();
    overrideGlobalFunctions();
    
    initialized = true;
  }

  // Public API
  return {
    initialize,
    hidePaywalls,
    enableDisabledFeatures
  };
})();

// Auto-initialize on load
window.FrogHireUsageBypass.initialize();

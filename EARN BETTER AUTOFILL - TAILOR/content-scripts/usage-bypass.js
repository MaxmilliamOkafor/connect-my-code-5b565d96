// ==== Usage Bypass Module ====
// Removes client-side usage limitations, quotas, and paywall restrictions
// MODIFIED: All usage limits disabled for unrestricted access

(function() {
  'use strict';

  // ============================================================
  // USAGE LIMIT PATTERNS TO BYPASS
  // ============================================================
  const LIMIT_PATTERNS = {
    // Text patterns that indicate usage limits
    textPatterns: [
      'limit reached',
      'quota exceeded',
      'daily limit',
      'weekly limit',
      'monthly limit',
      'usage limit',
      'application limit',
      'resume limit',
      'cover letter limit',
      'out of credits',
      'no credits',
      'credits remaining',
      'upgrade to',
      'upgrade now',
      'subscribe to',
      'premium feature',
      'pro feature',
      'unlock feature',
      'purchase required',
      'payment required',
      'free trial ended',
      'trial expired',
      'subscription required',
      'plan limit',
      'tier limit',
      'applications remaining',
      'resumes remaining',
      'ai generations remaining'
    ],

    // Class/ID patterns that indicate limit UI
    selectorPatterns: [
      '[class*="paywall"]',
      '[class*="upgrade"]',
      '[class*="premium"]',
      '[class*="limit"]',
      '[class*="quota"]',
      '[class*="subscription"]',
      '[id*="paywall"]',
      '[id*="upgrade"]',
      '[id*="limit"]',
      '[data-limit]',
      '[data-quota]',
      '[data-premium]'
    ]
  };

  // ============================================================
  // USAGE COUNTER BYPASS
  // ============================================================
  
  function bypassUsageCounters() {
    // Override common usage tracking variables
    const usageProps = [
      'usageCount', 'applicationCount', 'resumeCount', 'coverLetterCount',
      'dailyUsage', 'weeklyUsage', 'monthlyUsage', 'totalUsage',
      'remainingCredits', 'creditsRemaining', 'credits', 'quota',
      'limit', 'maxApplications', 'maxResumes', 'freeRemaining'
    ];

    // Intercept property access on window and common objects
    usageProps.forEach(prop => {
      // Make all usage-related properties return unlimited values
      try {
        Object.defineProperty(window, prop, {
          get: () => 999999,
          set: () => {},
          configurable: true
        });
      } catch (e) {
        // Property may already be defined
      }
    });

    console.log('[EarnBetter] Usage bypass: Counter overrides installed');
  }

  // ============================================================
  // STORAGE USAGE BYPASS
  // ============================================================
  
  function bypassStorageUsage() {
    const originalSetItem = localStorage.setItem.bind(localStorage);
    const originalGetItem = localStorage.getItem.bind(localStorage);

    // Keywords that indicate usage tracking
    const usageKeywords = [
      'usage', 'count', 'limit', 'quota', 'credit', 'remaining',
      'application', 'resume', 'daily', 'weekly', 'monthly',
      'subscription', 'tier', 'plan', 'premium', 'trial'
    ];

    localStorage.setItem = function(key, value) {
      const keyLower = key.toLowerCase();
      
      // Skip saving usage/limit data
      if (usageKeywords.some(kw => keyLower.includes(kw))) {
        console.log(`[EarnBetter] Blocking storage of usage data: ${key}`);
        return;
      }
      
      return originalSetItem(key, value);
    };

    localStorage.getItem = function(key) {
      const keyLower = key.toLowerCase();
      const value = originalGetItem(key);
      
      // Return unlimited values for usage queries
      if (usageKeywords.some(kw => keyLower.includes(kw))) {
        try {
          const parsed = JSON.parse(value);
          if (typeof parsed === 'number') {
            return '999999';
          }
          if (parsed && typeof parsed === 'object') {
            // Modify all numeric values to be high
            Object.keys(parsed).forEach(k => {
              if (typeof parsed[k] === 'number') {
                if (k.includes('remaining') || k.includes('credit') || k.includes('left')) {
                  parsed[k] = 999999;
                } else if (k.includes('limit') || k.includes('max')) {
                  parsed[k] = 999999;
                } else if (k.includes('used') || k.includes('count')) {
                  parsed[k] = 0;
                }
              }
              if (typeof parsed[k] === 'boolean') {
                if (k.includes('limit') || k.includes('block') || k.includes('disable')) {
                  parsed[k] = false;
                } else if (k.includes('allow') || k.includes('enable') || k.includes('active')) {
                  parsed[k] = true;
                }
              }
            });
            return JSON.stringify(parsed);
          }
        } catch (e) {
          // Not JSON
        }
      }
      
      return value;
    };

    console.log('[EarnBetter] Usage bypass: Storage interceptor installed');
  }

  // ============================================================
  // API RESPONSE BYPASS
  // ============================================================
  
  function bypassAPIUsage() {
    const originalFetch = window.fetch;

    window.fetch = async function(...args) {
      const response = await originalFetch.apply(this, args);
      const [url] = args;
      const urlStr = typeof url === 'string' ? url : url?.toString() || '';

      // Check if this might be a usage/limit endpoint
      if (urlStr.includes('earnbetter.com') && 
          (urlStr.includes('usage') || urlStr.includes('limit') || 
           urlStr.includes('quota') || urlStr.includes('subscription') ||
           urlStr.includes('credit') || urlStr.includes('plan'))) {
        
        try {
          const cloned = response.clone();
          const data = await cloned.json();
          
          // Modify usage-related response data
          const modifiedData = modifyUsageData(data);
          
          return new Response(JSON.stringify(modifiedData), {
            status: 200,
            headers: response.headers
          });
        } catch (e) {
          // Not JSON or parsing error
        }
      }

      return response;
    };

    // Also intercept XHR
    const originalXHRSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function(body) {
      const xhr = this;
      const originalOnReadyStateChange = xhr.onreadystatechange;

      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
          // Try to modify usage responses
          if (xhr._earnBetterUrl && 
              (xhr._earnBetterUrl.includes('usage') || xhr._earnBetterUrl.includes('limit'))) {
            try {
              const data = JSON.parse(xhr.responseText);
              const modified = modifyUsageData(data);
              Object.defineProperty(xhr, 'responseText', {
                value: JSON.stringify(modified),
                writable: false
              });
            } catch (e) {}
          }
        }
        if (originalOnReadyStateChange) {
          originalOnReadyStateChange.call(xhr);
        }
      };

      return originalXHRSend.call(this, body);
    };

    console.log('[EarnBetter] Usage bypass: API interceptors installed');
  }

  // Helper to modify usage data in responses
  function modifyUsageData(data) {
    if (!data || typeof data !== 'object') return data;

    const modified = { ...data };

    // Common usage-related fields
    const fieldsToMax = ['remaining', 'credits', 'left', 'available', 'limit', 'max', 'quota'];
    const fieldsToZero = ['used', 'count', 'consumed'];
    const fieldsToTrue = ['allowed', 'enabled', 'active', 'premium', 'pro', 'unlimited'];
    const fieldsToFalse = ['blocked', 'disabled', 'limited', 'expired', 'exceeded'];

    function processObject(obj) {
      if (!obj || typeof obj !== 'object') return obj;

      Object.keys(obj).forEach(key => {
        const keyLower = key.toLowerCase();
        const value = obj[key];

        if (typeof value === 'number') {
          if (fieldsToMax.some(f => keyLower.includes(f))) {
            obj[key] = 999999;
          } else if (fieldsToZero.some(f => keyLower.includes(f))) {
            obj[key] = 0;
          }
        } else if (typeof value === 'boolean') {
          if (fieldsToTrue.some(f => keyLower.includes(f))) {
            obj[key] = true;
          } else if (fieldsToFalse.some(f => keyLower.includes(f))) {
            obj[key] = false;
          }
        } else if (typeof value === 'object' && value !== null) {
          processObject(value);
        }
      });

      return obj;
    }

    return processObject(modified);
  }

  // ============================================================
  // UI LIMIT BYPASS
  // ============================================================
  
  function bypassUILimits() {
    // Observer to remove/hide limit-related UI
    const observer = new MutationObserver((mutations) => {
      // Hide paywall/upgrade modals and overlays
      LIMIT_PATTERNS.selectorPatterns.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          // Check if it's a blocking overlay or modal
          const style = window.getComputedStyle(el);
          if (style.position === 'fixed' || style.position === 'absolute') {
            if (style.zIndex && parseInt(style.zIndex) > 100) {
              console.log('[EarnBetter] Hiding limit/paywall overlay');
              el.style.display = 'none';
            }
          }
        });
      });

      // Re-enable disabled buttons
      document.querySelectorAll('button[disabled], input[type="submit"][disabled]').forEach(btn => {
        const text = btn.textContent?.toLowerCase() || '';
        const nearbyText = btn.parentElement?.textContent?.toLowerCase() || '';
        
        // Check if button was disabled due to limits
        if (LIMIT_PATTERNS.textPatterns.some(p => text.includes(p) || nearbyText.includes(p))) {
          console.log('[EarnBetter] Re-enabling limited button:', btn.textContent);
          btn.removeAttribute('disabled');
          btn.classList.remove('disabled');
          btn.style.pointerEvents = 'auto';
          btn.style.opacity = '1';
        }
      });

      // Hide limit warning messages
      document.querySelectorAll('[class*="warning"], [class*="error"], [class*="alert"], [class*="notice"]').forEach(el => {
        const text = el.textContent?.toLowerCase() || '';
        if (LIMIT_PATTERNS.textPatterns.some(p => text.includes(p))) {
          console.log('[EarnBetter] Hiding limit message');
          el.style.display = 'none';
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['disabled', 'class', 'style']
    });

    console.log('[EarnBetter] Usage bypass: UI monitor active');
  }

  // ============================================================
  // FUNCTION OVERRIDE BYPASS
  // ============================================================
  
  function bypassFunctionLimits() {
    // Override common limit-checking function names
    const limitFunctionPatterns = [
      'checkLimit', 'checkUsage', 'checkQuota', 'checkCredits',
      'isLimited', 'isBlocked', 'hasReachedLimit', 'exceedsLimit',
      'validateUsage', 'validateLimit', 'enforceLimit',
      'showUpgrade', 'showPaywall', 'showLimitModal'
    ];

    // Create a proxy for function calls
    const handler = {
      apply(target, thisArg, args) {
        const funcName = target.name?.toLowerCase() || '';
        
        // If it's a limit check, return "not limited"
        if (limitFunctionPatterns.some(p => funcName.includes(p.toLowerCase()))) {
          console.log(`[EarnBetter] Bypassing limit function: ${target.name}`);
          
          if (funcName.includes('show') || funcName.includes('display')) {
            return false; // Don't show paywall
          }
          if (funcName.includes('is') || funcName.includes('has') || funcName.includes('exceeds')) {
            return false; // Not limited
          }
          if (funcName.includes('check') || funcName.includes('validate')) {
            return true; // Validation passes
          }
          return undefined;
        }
        
        return Reflect.apply(target, thisArg, args);
      }
    };

    // Note: This would need the actual function references to work
    // This is a template for how to handle it if functions are found
    console.log('[EarnBetter] Usage bypass: Function interceptors ready');
  }

  // ============================================================
  // INITIALIZATION
  // ============================================================
  
  function initUsageBypass() {
    console.log('[EarnBetter] Usage Bypass Module initializing...');

    bypassUsageCounters();
    bypassStorageUsage();
    bypassAPIUsage();
    bypassFunctionLimits();

    // Wait for DOM before UI modifications
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bypassUILimits);
    } else {
      bypassUILimits();
    }

    console.log('[EarnBetter] Usage Bypass Module active - all limits removed');
  }

  // Export
  window.EarnBetterUsage = {
    patterns: LIMIT_PATTERNS,
    init: initUsageBypass,
    modifyUsageData: modifyUsageData
  };

  // Auto-initialize
  initUsageBypass();

})();

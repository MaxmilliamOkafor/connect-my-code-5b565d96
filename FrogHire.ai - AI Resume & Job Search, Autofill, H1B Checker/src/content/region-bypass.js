/**
 * ==== REGION BYPASS ====
 * Removes US-only restrictions to allow UK, Ireland, and other regions.
 * 
 * MODIFICATIONS:
 * - US, UK, and Ireland are always allowed
 * - Region error responses are handled gracefully
 * - Client-side country blocks are bypassed
 */

window.FrogHireRegionBypass = (function() {
  'use strict';

  // ========================================
  // ALLOWED REGIONS - UK and Ireland added
  // ========================================
  const ALLOWED_COUNTRIES = [
    'US', 'USA', 'United States', 'United States of America',
    'GB', 'UK', 'United Kingdom', 'Great Britain', 'England', 'Scotland', 'Wales', 'Northern Ireland',
    'IE', 'Ireland', 'Republic of Ireland', 'Éire',
    // Add more as needed - default to allowing all
    'CA', 'Canada',
    'AU', 'Australia',
    'NZ', 'New Zealand',
    'DE', 'Germany',
    'FR', 'France',
    'NL', 'Netherlands'
  ];

  const REGION_ERROR_PATTERNS = [
    /not available in your (country|region)/i,
    /us(-| )only/i,
    /united states only/i,
    /geo(-| )?restrict/i,
    /location not supported/i,
    /country not allowed/i,
    /region blocked/i,
    /service unavailable.*location/i
  ];

  let initialized = false;

  /**
   * Check if a country code/name is allowed
   */
  function isAllowedCountry(country) {
    if (!country) return true; // Allow if no country specified
    const normalized = country.toString().toUpperCase().trim();
    
    // Check against allowed list
    if (ALLOWED_COUNTRIES.some(c => c.toUpperCase() === normalized)) {
      return true;
    }
    
    // Default: Allow all countries (graceful degradation)
    return true;
  }

  /**
   * Check if an error message is a region restriction
   */
  function isRegionError(message) {
    if (!message) return false;
    return REGION_ERROR_PATTERNS.some(pattern => pattern.test(message));
  }

  /**
   * Intercept and modify fetch requests to bypass region checks
   */
  function interceptFetch() {
    const originalFetch = window.fetch;
    
    window.fetch = async function(...args) {
      try {
        const response = await originalFetch.apply(this, args);
        
        // Clone response to read body
        const clone = response.clone();
        
        try {
          const data = await clone.json();
          
          // Check if response contains region error
          if (data && (isRegionError(data.error) || isRegionError(data.message))) {
            console.log('[FrogHire] Region restriction bypassed in fetch response');
            
            // Return modified response that allows access
            return new Response(JSON.stringify({
              ...data,
              error: null,
              message: null,
              allowed: true,
              region_bypassed: true
            }), {
              status: 200,
              headers: response.headers
            });
          }
          
          // Modify country data to show allowed country
          if (data && data.country && !isAllowedCountry(data.country)) {
            data.country = 'US';
            data.countryCode = 'US';
            return new Response(JSON.stringify(data), {
              status: response.status,
              headers: response.headers
            });
          }
        } catch (e) {
          // Not JSON, return original
        }
        
        return response;
      } catch (error) {
        throw error;
      }
    };
  }

  /**
   * Intercept XMLHttpRequest for legacy API calls
   */
  function interceptXHR() {
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      this._frogHireUrl = url;
      return originalOpen.apply(this, [method, url, ...args]);
    };
    
    XMLHttpRequest.prototype.send = function(body) {
      const xhr = this;
      
      const originalOnLoad = xhr.onload;
      xhr.onload = function() {
        try {
          if (xhr.responseText) {
            const data = JSON.parse(xhr.responseText);
            
            // Check for region errors
            if (data && (isRegionError(data.error) || isRegionError(data.message))) {
              console.log('[FrogHire] Region restriction bypassed in XHR response');
              
              // Override response
              Object.defineProperty(xhr, 'responseText', {
                value: JSON.stringify({
                  ...data,
                  error: null,
                  allowed: true
                })
              });
            }
          }
        } catch (e) {
          // Not JSON, ignore
        }
        
        if (originalOnLoad) {
          originalOnLoad.apply(this, arguments);
        }
      };
      
      return originalSend.apply(this, [body]);
    };
  }

  /**
   * Override localStorage/sessionStorage for cached region data
   */
  function overrideStorage() {
    const storageKeys = [
      'user_country', 'userCountry', 'country', 'countryCode',
      'geo_data', 'geoData', 'location_data', 'region',
      'user_region', 'userRegion'
    ];
    
    // Override getItem to return allowed country
    const originalGetItem = Storage.prototype.getItem;
    Storage.prototype.getItem = function(key) {
      const value = originalGetItem.call(this, key);
      
      if (storageKeys.some(k => key.toLowerCase().includes(k.toLowerCase()))) {
        try {
          const data = JSON.parse(value);
          if (data && data.country && !isAllowedCountry(data.country)) {
            return JSON.stringify({ ...data, country: 'US', countryCode: 'US' });
          }
        } catch (e) {
          // If it's a simple string value
          if (value && !isAllowedCountry(value)) {
            return 'US';
          }
        }
      }
      
      return value;
    };
  }

  /**
   * Bypass signup forms that check for US-only
   */
  function bypassSignupForms() {
    // Watch for country select dropdowns and auto-select allowed country
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Find country selects
            const countrySelects = node.querySelectorAll ? 
              node.querySelectorAll('select[name*="country"], select[id*="country"], [data-testid*="country"]') : [];
            
            countrySelects.forEach(select => {
              // Find and select US, UK, or Ireland option
              const options = select.querySelectorAll('option');
              for (const opt of options) {
                if (['US', 'USA', 'United States', 'GB', 'UK', 'United Kingdom', 'IE', 'Ireland']
                    .some(c => opt.value.includes(c) || opt.textContent.includes(c))) {
                  select.value = opt.value;
                  select.dispatchEvent(new Event('change', { bubbles: true }));
                  break;
                }
              }
            });
            
            // Find region error messages and hide them
            const errorElements = node.querySelectorAll ? 
              node.querySelectorAll('.error, .alert, [class*="error"], [class*="warning"]') : [];
            
            errorElements.forEach(el => {
              if (isRegionError(el.textContent)) {
                el.style.display = 'none';
                console.log('[FrogHire] Hidden region error message');
              }
            });
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
   * Override window properties that might expose region
   */
  function overrideWindowProperties() {
    // Override navigator.language to include en-US
    try {
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en-GB', 'en'],
        configurable: true
      });
    } catch (e) {}
  }

  /**
   * Initialize all region bypass mechanisms
   */
  function initialize() {
    if (initialized) return;
    
    console.log('[FrogHire] Initializing region bypass - UK/Ireland enabled');
    
    interceptFetch();
    interceptXHR();
    overrideStorage();
    bypassSignupForms();
    overrideWindowProperties();
    
    initialized = true;
  }

  // Public API
  return {
    initialize,
    isAllowedCountry,
    isRegionError,
    ALLOWED_COUNTRIES
  };
})();

// Auto-initialize on load
window.FrogHireRegionBypass.initialize();

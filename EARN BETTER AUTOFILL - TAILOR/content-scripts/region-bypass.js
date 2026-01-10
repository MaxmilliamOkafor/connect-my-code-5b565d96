// ==== Region Bypass Module ====
// Removes US-only restrictions to allow UK, Ireland, and other regions
// MODIFIED: Account/region restrictions relaxed for UK and Ireland users

(function() {
  'use strict';

  // ============================================================
  // ALLOWED REGIONS - US, UK, Ireland (and others as fallback)
  // ============================================================
  const ALLOWED_COUNTRIES = [
    'US', 'USA', 'United States', 'United States of America',
    'GB', 'UK', 'United Kingdom', 'Great Britain', 'England', 'Scotland', 'Wales', 'Northern Ireland',
    'IE', 'Ireland', 'Republic of Ireland', 'Eire'
  ];

  // Additional regions that should be allowed (fallback)
  const EXTENDED_ALLOWED_REGIONS = [
    'CA', 'Canada',
    'AU', 'Australia',
    'NZ', 'New Zealand',
    'DE', 'Germany',
    'FR', 'France',
    'NL', 'Netherlands',
    'BE', 'Belgium',
    'CH', 'Switzerland',
    'AT', 'Austria',
    'SE', 'Sweden',
    'NO', 'Norway',
    'DK', 'Denmark',
    'FI', 'Finland',
    'ES', 'Spain',
    'IT', 'Italy',
    'PT', 'Portugal',
    'PL', 'Poland',
    'CZ', 'Czech Republic',
    'SG', 'Singapore',
    'HK', 'Hong Kong',
    'JP', 'Japan',
    'KR', 'South Korea',
    'IN', 'India'
  ];

  // Combine all allowed regions
  const ALL_ALLOWED_REGIONS = [...ALLOWED_COUNTRIES, ...EXTENDED_ALLOWED_REGIONS];

  // ============================================================
  // REGION CHECK BYPASS
  // ============================================================
  
  // Override any region check functions
  function bypassRegionChecks() {
    // Store original fetch
    const originalFetch = window.fetch;

    // Intercept fetch requests to modify region-related responses
    window.fetch = async function(...args) {
      const [url, options] = args;
      
      try {
        const response = await originalFetch.apply(this, args);
        
        // Check if this is a region/country check endpoint
        const urlStr = typeof url === 'string' ? url : url.toString();
        
        if (urlStr.includes('earnbetter.com') && 
            (urlStr.includes('region') || urlStr.includes('country') || urlStr.includes('geo') || urlStr.includes('location'))) {
          
          // Clone the response to read it
          const clonedResponse = response.clone();
          
          try {
            const data = await clonedResponse.json();
            
            // If there's a country/region block, bypass it
            if (data && (data.blocked || data.restricted || data.error?.includes('region') || data.error?.includes('country'))) {
              console.log('[EarnBetter] Region restriction detected - bypassing');
              
              // Return a modified response that allows access
              return new Response(JSON.stringify({
                ...data,
                blocked: false,
                restricted: false,
                allowed: true,
                country: 'US',
                region: 'allowed',
                error: null
              }), {
                status: 200,
                headers: response.headers
              });
            }
          } catch (e) {
            // Not JSON, return original response
          }
        }
        
        return response;
      } catch (error) {
        // If request fails due to region block, return success anyway
        console.log('[EarnBetter] Request error - returning bypass response');
        return new Response(JSON.stringify({
          success: true,
          allowed: true,
          country: 'US'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    };

    console.log('[EarnBetter] Region bypass: Fetch interceptor installed');
  }

  // ============================================================
  // COUNTRY VALIDATION BYPASS
  // ============================================================
  
  function bypassCountryValidation() {
    // Override common country check patterns
    const originalDefineProperty = Object.defineProperty;
    
    Object.defineProperty = function(obj, prop, descriptor) {
      // Intercept country/region property definitions
      if (typeof prop === 'string' && 
          (prop.toLowerCase().includes('country') || 
           prop.toLowerCase().includes('region') || 
           prop.toLowerCase().includes('allowed') ||
           prop.toLowerCase().includes('blocked'))) {
        
        // Modify getter to always return allowed status
        if (descriptor.get) {
          const originalGet = descriptor.get;
          descriptor.get = function() {
            const value = originalGet.call(this);
            
            // If it's a blocked/restricted check, return false (not blocked)
            if (prop.toLowerCase().includes('blocked') || prop.toLowerCase().includes('restricted')) {
              return false;
            }
            
            // If it's an allowed check, return true
            if (prop.toLowerCase().includes('allowed')) {
              return true;
            }
            
            // If it's a country code, return 'US' if blocked
            if (prop.toLowerCase().includes('country') && !ALL_ALLOWED_REGIONS.includes(value)) {
              return 'US';
            }
            
            return value;
          };
        }
        
        // Modify value if it's a direct assignment
        if ('value' in descriptor) {
          if (prop.toLowerCase().includes('blocked') || prop.toLowerCase().includes('restricted')) {
            descriptor.value = false;
          } else if (prop.toLowerCase().includes('allowed')) {
            descriptor.value = true;
          }
        }
      }
      
      return originalDefineProperty.call(Object, obj, prop, descriptor);
    };
    
    console.log('[EarnBetter] Region bypass: Property interceptor installed');
  }

  // ============================================================
  // SIGNUP FLOW BYPASS
  // ============================================================
  
  function bypassSignupRestrictions() {
    // Wait for any signup forms to load
    const observer = new MutationObserver((mutations) => {
      // Look for region/country error messages and hide them
      const errorMessages = document.querySelectorAll('[class*="error"], [class*="warning"], [class*="alert"]');
      
      errorMessages.forEach(el => {
        const text = el.textContent?.toLowerCase() || '';
        if (text.includes('region') || text.includes('country') || text.includes('not available') || 
            text.includes('us only') || text.includes('united states only')) {
          
          console.log('[EarnBetter] Hiding region restriction message');
          el.style.display = 'none';
          
          // Also try to enable any disabled buttons nearby
          const form = el.closest('form');
          if (form) {
            const buttons = form.querySelectorAll('button[disabled], input[type="submit"][disabled]');
            buttons.forEach(btn => {
              btn.removeAttribute('disabled');
              btn.classList.remove('disabled');
            });
          }
        }
      });

      // Look for country dropdowns and pre-select allowed country
      const countrySelects = document.querySelectorAll('select[name*="country"], select[id*="country"]');
      countrySelects.forEach(select => {
        // Try to find US, UK, or Ireland option
        const options = Array.from(select.options);
        const preferredOption = options.find(opt => 
          opt.value === 'US' || opt.value === 'GB' || opt.value === 'IE' ||
          opt.text.includes('United States') || opt.text.includes('United Kingdom') || opt.text.includes('Ireland')
        );
        
        if (preferredOption && !select.dataset.regionBypassed) {
          select.value = preferredOption.value;
          select.dataset.regionBypassed = 'true';
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    console.log('[EarnBetter] Region bypass: Signup flow monitor active');
  }

  // ============================================================
  // LOCALSTORAGE BYPASS
  // ============================================================
  
  function bypassStorageRestrictions() {
    // Override localStorage to ensure region data is always "allowed"
    const originalSetItem = localStorage.setItem.bind(localStorage);
    const originalGetItem = localStorage.getItem.bind(localStorage);

    localStorage.setItem = function(key, value) {
      // Intercept region/country storage
      if (key.toLowerCase().includes('region') || key.toLowerCase().includes('country') || 
          key.toLowerCase().includes('geo') || key.toLowerCase().includes('location')) {
        
        try {
          const parsed = JSON.parse(value);
          if (parsed && typeof parsed === 'object') {
            parsed.allowed = true;
            parsed.blocked = false;
            parsed.restricted = false;
            if (!ALL_ALLOWED_REGIONS.includes(parsed.country)) {
              parsed.country = 'US';
            }
            value = JSON.stringify(parsed);
          }
        } catch (e) {
          // Not JSON, check for blocked values
          if (value === 'blocked' || value === 'restricted') {
            value = 'allowed';
          }
        }
      }
      
      return originalSetItem(key, value);
    };

    localStorage.getItem = function(key) {
      const value = originalGetItem(key);
      
      // Intercept region/country reads
      if (key.toLowerCase().includes('region') || key.toLowerCase().includes('country') ||
          key.toLowerCase().includes('geo') || key.toLowerCase().includes('location')) {
        
        if (value === 'blocked' || value === 'restricted') {
          return 'allowed';
        }
        
        try {
          const parsed = JSON.parse(value);
          if (parsed && typeof parsed === 'object') {
            if (parsed.blocked || parsed.restricted) {
              parsed.allowed = true;
              parsed.blocked = false;
              parsed.restricted = false;
              return JSON.stringify(parsed);
            }
          }
        } catch (e) {
          // Not JSON
        }
      }
      
      return value;
    };

    console.log('[EarnBetter] Region bypass: LocalStorage interceptor installed');
  }

  // ============================================================
  // API RESPONSE MODIFIER
  // ============================================================
  
  function installAPIBypass() {
    // Intercept XMLHttpRequest for older code paths
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method, url, ...rest) {
      this._earnBetterUrl = url;
      return originalXHROpen.call(this, method, url, ...rest);
    };

    XMLHttpRequest.prototype.send = function(body) {
      const xhr = this;
      const originalOnLoad = xhr.onload;

      xhr.onload = function() {
        // Check if this is a region-related request
        if (xhr._earnBetterUrl && 
            (xhr._earnBetterUrl.includes('region') || 
             xhr._earnBetterUrl.includes('country') || 
             xhr._earnBetterUrl.includes('geo'))) {
          
          try {
            const data = JSON.parse(xhr.responseText);
            if (data.blocked || data.restricted) {
              // Modify the response
              Object.defineProperty(xhr, 'responseText', {
                value: JSON.stringify({
                  ...data,
                  blocked: false,
                  restricted: false,
                  allowed: true,
                  country: 'US'
                })
              });
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }

        if (originalOnLoad) {
          originalOnLoad.call(xhr);
        }
      };

      return originalXHRSend.call(this, body);
    };

    console.log('[EarnBetter] Region bypass: XHR interceptor installed');
  }

  // ============================================================
  // INITIALIZATION
  // ============================================================
  
  function initRegionBypass() {
    console.log('[EarnBetter] Region Bypass Module initializing...');
    console.log('[EarnBetter] Allowed regions:', ALLOWED_COUNTRIES.slice(0, 10).join(', '), '+ more');

    bypassRegionChecks();
    bypassCountryValidation();
    bypassStorageRestrictions();
    installAPIBypass();

    // Wait for DOM before monitoring signup flows
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bypassSignupRestrictions);
    } else {
      bypassSignupRestrictions();
    }

    console.log('[EarnBetter] Region Bypass Module active - UK and Ireland now supported');
  }

  // Export
  window.EarnBetterRegion = {
    allowedCountries: ALL_ALLOWED_REGIONS,
    isAllowed: (country) => ALL_ALLOWED_REGIONS.some(c => 
      c.toLowerCase() === country?.toLowerCase()
    ),
    init: initRegionBypass
  };

  // Auto-initialize
  initRegionBypass();

})();

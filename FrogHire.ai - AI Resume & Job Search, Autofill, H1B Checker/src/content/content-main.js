/**
 * ==== CONTENT MAIN ====
 * Main content script integrating all FrogHire modules.
 * 
 * - ATS Registry for platform detection
 * - Region Bypass for UK/Ireland support
 * - Usage Bypass for unlimited access
 * - Autofill Engine for form filling
 * 
 * LEVER AND ASHBY ARE EXCLUDED - extension becomes inert on these platforms.
 */

(function() {
  'use strict';

  // ========================================
  // EXCLUDED PLATFORM CHECK (LEVER/ASHBY)
  // ========================================
  if (window.FrogHireATSRegistry && window.FrogHireATSRegistry.isExcludedPlatform()) {
    console.log('[FrogHire] Extension disabled on excluded platform (Lever/Ashby)');
    return; // Exit completely - extension becomes inert
  }

  console.log('[FrogHire] Content script initialized');

  // ========================================
  // PLATFORM DETECTION
  // ========================================
  const currentPlatform = window.FrogHireATSRegistry?.detectPlatform();
  const platformName = currentPlatform?.name || 'Generic';
  const platformKey = currentPlatform?.key || 'generic';

  console.log(`[FrogHire] Platform: ${platformName}`);

  // ========================================
  // INITIALIZE MODULES
  // ========================================
  
  // Region bypass should already be initialized via its auto-init
  // Usage bypass should already be initialized via its auto-init
  
  // ========================================
  // MESSAGE LISTENER FOR POPUP COMMUNICATION
  // ========================================
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[FrogHire] Message received:', request.action);

    switch (request.action) {
      case 'autofill':
        handleAutofill(request.profile, sendResponse);
        return true; // Keep channel open for async response

      case 'detectFields':
        handleDetectFields(sendResponse);
        return true;

      case 'getPlatformInfo':
        sendResponse({
          success: true,
          platform: platformName,
          key: platformKey,
          url: window.location.href
        });
        break;

      case 'ping':
        sendResponse({ success: true, active: true });
        break;

      default:
        sendResponse({ success: false, error: 'Unknown action' });
    }
  });

  /**
   * Handle autofill request from popup
   */
  async function handleAutofill(profile, sendResponse) {
    try {
      if (!profile) {
        sendResponse({ success: false, error: 'No profile data provided' });
        return;
      }

      const engine = window.FrogHireAutofillEngine;
      if (!engine) {
        sendResponse({ success: false, error: 'Autofill engine not loaded' });
        return;
      }

      // Get platform-specific selectors if available
      const platformSelectors = currentPlatform?.selectors || {};
      
      // First try platform-specific autofill
      if (Object.keys(platformSelectors).length > 0) {
        console.log(`[FrogHire] Using ${platformName} selectors`);
        await fillWithSelectors(platformSelectors, profile);
      }

      // Then use generic autofill engine for remaining fields
      const results = engine.autofillForm(profile);

      sendResponse({
        success: true,
        platform: platformName,
        results
      });
    } catch (error) {
      console.error('[FrogHire] Autofill error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  /**
   * Fill fields using platform-specific selectors
   */
  async function fillWithSelectors(selectors, profile) {
    const engine = window.FrogHireAutofillEngine;
    
    for (const [fieldType, selectorList] of Object.entries(selectors)) {
      const value = getProfileValue(profile, fieldType);
      if (!value) continue;

      for (const selector of selectorList) {
        try {
          const element = document.querySelector(selector);
          if (element && engine.setFieldValue(element, value)) {
            console.log(`[FrogHire] Filled ${fieldType} via selector: ${selector}`);
            break;
          }
        } catch (e) {
          // Selector might be invalid, continue to next
        }
      }
    }
  }

  /**
   * Get value from profile for a field type
   */
  function getProfileValue(profile, fieldType) {
    const mappings = {
      firstName: ['firstName', 'first_name'],
      lastName: ['lastName', 'last_name'],
      email: ['email', 'emailAddress'],
      phone: ['phone', 'phoneNumber', 'telephone'],
      linkedin: ['linkedin', 'linkedinUrl', 'linkedInProfile'],
      resume: null, // Handled separately
      coverLetter: ['coverLetter', 'cover_letter'],
      address: ['address', 'streetAddress', 'address1'],
      city: ['city', 'cityName'],
      country: ['country', 'countryCode'],
      location: ['location', 'currentLocation']
    };

    const keys = mappings[fieldType];
    if (!keys) return profile[fieldType];

    for (const key of keys) {
      if (profile[key]) return profile[key];
    }
    return null;
  }

  /**
   * Handle field detection request
   */
  function handleDetectFields(sendResponse) {
    try {
      const engine = window.FrogHireAutofillEngine;
      if (!engine) {
        sendResponse({ success: false, error: 'Autofill engine not loaded' });
        return;
      }

      const fields = engine.detectFields();
      const fieldList = Object.entries(fields).map(([type, info]) => ({
        type,
        id: info.id,
        name: info.name
      }));

      sendResponse({
        success: true,
        platform: platformName,
        fields: fieldList,
        count: fieldList.length
      });
    } catch (error) {
      console.error('[FrogHire] Field detection error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  // ========================================
  // AUTO-DETECT FORMS ON PAGE
  // ========================================
  function initializePageMonitoring() {
    // Initial scan
    const engine = window.FrogHireAutofillEngine;
    if (engine) {
      const fields = engine.detectFields();
      if (Object.keys(fields).length > 0) {
        console.log(`[FrogHire] Detected ${Object.keys(fields).length} fillable fields`);
        
        // Notify background script that page has forms
        chrome.runtime.sendMessage({
          action: 'pageHasForms',
          platform: platformName,
          fieldCount: Object.keys(fields).length,
          url: window.location.href
        }).catch(() => {}); // Ignore if background not ready
      }
    }

    // Watch for dynamic form additions (SPAs)
    const observer = new MutationObserver((mutations) => {
      let hasNewForms = false;
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName === 'FORM' || 
                (node.querySelector && node.querySelector('form, input, textarea'))) {
              hasNewForms = true;
              break;
            }
          }
        }
        if (hasNewForms) break;
      }

      if (hasNewForms && engine) {
        const fields = engine.detectFields();
        console.log(`[FrogHire] Dynamic forms detected: ${Object.keys(fields).length} fields`);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Initialize after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePageMonitoring);
  } else {
    initializePageMonitoring();
  }

  // ========================================
  // EXPOSE API FOR DEBUGGING
  // ========================================
  window.__FrogHireDebug = {
    platform: currentPlatform,
    detectFields: () => window.FrogHireAutofillEngine?.detectFields(),
    autofill: (profile) => window.FrogHireAutofillEngine?.autofillForm(profile),
    isExcluded: () => window.FrogHireATSRegistry?.isExcludedPlatform()
  };

  console.log('[FrogHire] Ready - Use window.__FrogHireDebug for debugging');
})();

// ==== EARN BETTER AUTOFILL - TAILOR (Extended) ====
// Main content script - integrates all modules
// MODIFICATIONS:
// - Lever and Ashby explicitly EXCLUDED (extension inert on these sites)
// - UK and Ireland region restrictions REMOVED
// - Usage limitations DISABLED

(function() {
  'use strict';

  console.log('[EarnBetter Extended] Initializing...');

  // ============================================================
  // LEVER/ASHBY EXCLUSION CHECK
  // ============================================================
  if (window.EarnBetterATS?.isExcludedPlatform()) {
    console.log('[EarnBetter] Extension disabled on this platform (Lever/Ashby excluded)');
    return; // Exit completely - extension becomes inert
  }

  // ============================================================
  // DETECT ATS PLATFORM
  // ============================================================
  const detectedATS = window.EarnBetterATS?.detectATS();
  
  if (detectedATS) {
    console.log(`[EarnBetter] Using ${detectedATS.config.name} selectors`);
  } else {
    console.log('[EarnBetter] Unknown platform - using generic autofill');
  }

  // ============================================================
  // MAIN INITIALIZATION
  // ============================================================
  function init() {
    // Region bypass is auto-initialized by region-bypass.js
    // Usage bypass is auto-initialized by usage-bypass.js
    
    // Set up message listener for popup communication
    chrome.runtime.onMessage?.addListener((message, sender, sendResponse) => {
      if (message.action === 'autofill' && message.userData) {
        const forms = window.EarnBetterAutofill?.detectForms() || [];
        let totalFilled = 0;
        
        forms.forEach(form => {
          totalFilled += window.EarnBetterAutofill?.autofillForm(form, message.userData) || 0;
        });
        
        sendResponse({ success: true, filledCount: totalFilled });
      }
      
      if (message.action === 'detectFields') {
        const forms = window.EarnBetterAutofill?.detectForms() || [];
        const allFields = {};
        
        forms.forEach(form => {
          const mapped = window.EarnBetterAutofill?.mapFormFields(form) || {};
          Object.assign(allFields, mapped);
        });
        
        sendResponse({ fields: Object.keys(allFields), ats: detectedATS?.config.name || 'Generic' });
      }
      
      return true;
    });

    console.log('[EarnBetter Extended] Ready - ATS support expanded, UK/Ireland enabled, limits removed');
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

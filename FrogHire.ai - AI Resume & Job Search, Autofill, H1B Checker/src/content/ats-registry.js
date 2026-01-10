/**
 * ==== ATS REGISTRY ====
 * Configurable registry for ATS platform detection and field selectors.
 * 
 * LEVER AND ASHBY ARE EXPLICITLY EXCLUDED - extension becomes inert on these platforms.
 */

window.FrogHireATSRegistry = (function() {
  'use strict';

  // ========================================
  // EXCLUDED PLATFORMS - Extension becomes inert
  // ========================================
  const EXCLUDED_DOMAINS = [
    'lever.co',
    'jobs.lever.co',
    'ashbyhq.com',
    'jobs.ashby.io',
    'ashby.io'
  ];

  /**
   * Check if current URL belongs to an excluded platform (Lever or Ashby)
   * If true, all autofill features should be disabled
   */
  function isExcludedPlatform() {
    const hostname = window.location.hostname.toLowerCase();
    return EXCLUDED_DOMAINS.some(domain => 
      hostname === domain || hostname.endsWith('.' + domain)
    );
  }

  // ========================================
  // SUPPORTED ATS PLATFORMS REGISTRY
  // ========================================
  const ATS_PLATFORMS = {
    // ---- Major Job Boards ----
    linkedin: {
      name: 'LinkedIn',
      patterns: [/linkedin\.com/i],
      selectors: {
        firstName: ['input[name="firstName"]', '#first-name', 'input[id*="firstName"]'],
        lastName: ['input[name="lastName"]', '#last-name', 'input[id*="lastName"]'],
        email: ['input[name="email"]', 'input[type="email"]', '#email'],
        phone: ['input[name="phone"]', 'input[type="tel"]', '#phone'],
        resume: ['input[type="file"][accept*="pdf"]', 'input[name*="resume"]'],
        coverLetter: ['textarea[name*="cover"]', '#cover-letter'],
        linkedin: ['input[name*="linkedin"]', 'input[id*="linkedin"]'],
        location: ['input[name*="location"]', '#location']
      }
    },

    indeed: {
      name: 'Indeed',
      patterns: [/indeed\.com/i, /indeed\.co\./i],
      selectors: {
        firstName: ['input[name="firstName"]', '#input-firstName'],
        lastName: ['input[name="lastName"]', '#input-lastName'],
        email: ['input[name="email"]', 'input[type="email"]'],
        phone: ['input[name="phone"]', 'input[type="tel"]'],
        resume: ['input[type="file"]', '#resume-upload'],
        city: ['input[name="city"]', '#city'],
        experience: ['textarea[name*="experience"]']
      }
    },

    glassdoor: {
      name: 'Glassdoor',
      patterns: [/glassdoor\.com/i, /glassdoor\.co\./i],
      selectors: {
        firstName: ['input[name="firstName"]', '#firstName'],
        lastName: ['input[name="lastName"]', '#lastName'],
        email: ['input[type="email"]', '#email'],
        phone: ['input[type="tel"]', '#phone'],
        resume: ['input[type="file"]']
      }
    },

    // ---- Enterprise ATS ----
    workday: {
      name: 'Workday',
      patterns: [/workday\.com/i, /myworkdayjobs\.com/i],
      selectors: {
        firstName: ['input[data-automation-id="legalNameSection_firstName"]', 'input[id*="firstName"]'],
        lastName: ['input[data-automation-id="legalNameSection_lastName"]', 'input[id*="lastName"]'],
        email: ['input[data-automation-id="email"]', 'input[type="email"]'],
        phone: ['input[data-automation-id="phone"]', 'input[type="tel"]'],
        address: ['input[data-automation-id="addressSection_addressLine1"]'],
        city: ['input[data-automation-id="addressSection_city"]'],
        country: ['select[data-automation-id="countryDropdown"]', 'button[data-automation-id="countryDropdown"]'],
        resume: ['input[type="file"][data-automation-id="file-upload-input-ref"]', 'input[type="file"]']
      }
    },

    greenhouse: {
      name: 'Greenhouse',
      patterns: [/greenhouse\.io/i, /boards\.greenhouse/i],
      selectors: {
        firstName: ['input#first_name', 'input[name="job_application[first_name]"]'],
        lastName: ['input#last_name', 'input[name="job_application[last_name]"]'],
        email: ['input#email', 'input[name="job_application[email]"]', 'input[type="email"]'],
        phone: ['input#phone', 'input[name="job_application[phone]"]', 'input[type="tel"]'],
        resume: ['input[type="file"]#resume', 'input[name="job_application[resume]"]'],
        coverLetter: ['textarea#cover_letter', 'input[name="job_application[cover_letter]"]'],
        linkedin: ['input[autocomplete="custom-question-linkedin"]', 'input[id*="linkedin"]'],
        location: ['input#location', 'input[name*="location"]']
      }
    },

    taleo: {
      name: 'Taleo',
      patterns: [/taleo\.net/i, /taleo\./i],
      selectors: {
        firstName: ['input[id*="FirstName"]', 'input[name*="firstName"]'],
        lastName: ['input[id*="LastName"]', 'input[name*="lastName"]'],
        email: ['input[id*="Email"]', 'input[type="email"]'],
        phone: ['input[id*="Phone"]', 'input[type="tel"]'],
        resume: ['input[type="file"]'],
        address: ['input[id*="Address"]', 'input[name*="address"]'],
        city: ['input[id*="City"]', 'input[name*="city"]']
      }
    },

    smartrecruiters: {
      name: 'SmartRecruiters',
      patterns: [/smartrecruiters\.com/i, /jobs\.smartrecruiters/i],
      selectors: {
        firstName: ['input[name="firstName"]', '#firstName'],
        lastName: ['input[name="lastName"]', '#lastName'],
        email: ['input[name="email"]', 'input[type="email"]'],
        phone: ['input[name="phoneNumber"]', 'input[type="tel"]'],
        resume: ['input[type="file"]', '#resume-input'],
        linkedin: ['input[name*="linkedin"]'],
        location: ['input[name="location"]']
      }
    },

    icims: {
      name: 'iCIMS',
      patterns: [/icims\.com/i, /\.icims\./i],
      selectors: {
        firstName: ['input[id*="FirstName"]', 'input[name*="firstName"]'],
        lastName: ['input[id*="LastName"]', 'input[name*="lastName"]'],
        email: ['input[id*="Email"]', 'input[type="email"]'],
        phone: ['input[id*="Phone"]', 'input[type="tel"]'],
        resume: ['input[type="file"]'],
        address: ['input[id*="Address"]']
      }
    },

    successfactors: {
      name: 'SuccessFactors',
      patterns: [/successfactors\.com/i, /successfactors\.eu/i],
      selectors: {
        firstName: ['input[id*="firstName"]', 'input[name*="firstName"]'],
        lastName: ['input[id*="lastName"]', 'input[name*="lastName"]'],
        email: ['input[type="email"]', 'input[id*="email"]'],
        phone: ['input[type="tel"]', 'input[id*="phone"]'],
        resume: ['input[type="file"]']
      }
    },

    jobvite: {
      name: 'Jobvite',
      patterns: [/jobvite\.com/i, /jobs\.jobvite/i],
      selectors: {
        firstName: ['input[name="firstName"]', '#firstName'],
        lastName: ['input[name="lastName"]', '#lastName'],
        email: ['input[name="email"]', 'input[type="email"]'],
        phone: ['input[name="phone"]', 'input[type="tel"]'],
        resume: ['input[type="file"]'],
        linkedin: ['input[name*="linkedin"]']
      }
    },

    // ---- Modern ATS ----
    teamtailor: {
      name: 'Teamtailor',
      patterns: [/teamtailor\.com/i, /\.teamtailor\./i],
      selectors: {
        firstName: ['input[name*="first_name"]', 'input[id*="firstName"]'],
        lastName: ['input[name*="last_name"]', 'input[id*="lastName"]'],
        email: ['input[type="email"]', 'input[name*="email"]'],
        phone: ['input[type="tel"]', 'input[name*="phone"]'],
        resume: ['input[type="file"]'],
        linkedin: ['input[name*="linkedin"]']
      }
    },

    bamboohr: {
      name: 'BambooHR',
      patterns: [/bamboohr\.com/i],
      selectors: {
        firstName: ['input[name="firstName"]', '#firstName'],
        lastName: ['input[name="lastName"]', '#lastName'],
        email: ['input[type="email"]', '#email'],
        phone: ['input[type="tel"]', '#phone'],
        resume: ['input[type="file"]'],
        address: ['input[name*="address"]'],
        city: ['input[name*="city"]']
      }
    },

    workable: {
      name: 'Workable',
      patterns: [/workable\.com/i, /apply\.workable/i],
      selectors: {
        firstName: ['input[name="firstname"]', '#firstname'],
        lastName: ['input[name="lastname"]', '#lastname'],
        email: ['input[name="email"]', 'input[type="email"]'],
        phone: ['input[name="phone"]', 'input[type="tel"]'],
        resume: ['input[type="file"]', '#resume'],
        coverLetter: ['textarea[name*="cover"]'],
        linkedin: ['input[name*="linkedin"]']
      }
    },

    // ---- UK & Ireland Job Boards ----
    reed: {
      name: 'Reed',
      patterns: [/reed\.co\.uk/i],
      selectors: {
        firstName: ['input[name="FirstName"]', '#FirstName'],
        lastName: ['input[name="Surname"]', '#Surname'],
        email: ['input[type="email"]', '#Email'],
        phone: ['input[type="tel"]', '#Phone'],
        resume: ['input[type="file"]'],
        location: ['input[name*="location"]', '#location']
      }
    },

    totaljobs: {
      name: 'TotalJobs',
      patterns: [/totaljobs\.com/i],
      selectors: {
        firstName: ['input[name="firstName"]', '#firstName'],
        lastName: ['input[name="lastName"]', '#lastName'],
        email: ['input[type="email"]'],
        phone: ['input[type="tel"]'],
        resume: ['input[type="file"]']
      }
    },

    cvlibrary: {
      name: 'CV-Library',
      patterns: [/cvlibrary\.co\.uk/i],
      selectors: {
        firstName: ['input[name="first_name"]', '#first_name'],
        lastName: ['input[name="surname"]', '#surname'],
        email: ['input[type="email"]', '#email'],
        phone: ['input[type="tel"]', '#phone'],
        resume: ['input[type="file"]']
      }
    },

    jobsie: {
      name: 'Jobs.ie',
      patterns: [/jobs\.ie/i],
      selectors: {
        firstName: ['input[name*="firstName"]', '#firstName'],
        lastName: ['input[name*="lastName"]', '#lastName'],
        email: ['input[type="email"]'],
        phone: ['input[type="tel"]'],
        resume: ['input[type="file"]']
      }
    },

    irishjobs: {
      name: 'IrishJobs',
      patterns: [/irishjobs\.ie/i],
      selectors: {
        firstName: ['input[name*="firstName"]'],
        lastName: ['input[name*="lastName"]'],
        email: ['input[type="email"]'],
        phone: ['input[type="tel"]'],
        resume: ['input[type="file"]']
      }
    },

    // ---- Other Enterprise ATS ----
    oraclecloud: {
      name: 'Oracle Cloud HCM',
      patterns: [/oraclecloud\.com/i, /oracle.*recruiting/i],
      selectors: {
        firstName: ['input[id*="firstName"]', 'input[name*="firstName"]'],
        lastName: ['input[id*="lastName"]', 'input[name*="lastName"]'],
        email: ['input[type="email"]'],
        phone: ['input[type="tel"]'],
        resume: ['input[type="file"]']
      }
    },

    recruitee: {
      name: 'Recruitee',
      patterns: [/recruitee\.com/i],
      selectors: {
        firstName: ['input[name="first_name"]'],
        lastName: ['input[name="last_name"]'],
        email: ['input[type="email"]'],
        phone: ['input[type="tel"]'],
        resume: ['input[type="file"]']
      }
    },

    breezyhr: {
      name: 'Breezy HR',
      patterns: [/breezy\.hr/i],
      selectors: {
        firstName: ['input[name*="first"]', 'input[id*="first"]'],
        lastName: ['input[name*="last"]', 'input[id*="last"]'],
        email: ['input[type="email"]'],
        phone: ['input[type="tel"]'],
        resume: ['input[type="file"]']
      }
    },

    jazzhr: {
      name: 'JazzHR',
      patterns: [/jazz\.co/i, /applytojob\.com/i],
      selectors: {
        firstName: ['input[name="first_name"]', '#first_name'],
        lastName: ['input[name="last_name"]', '#last_name'],
        email: ['input[type="email"]', '#email'],
        phone: ['input[type="tel"]', '#phone'],
        resume: ['input[type="file"]']
      }
    }
  };

  /**
   * Detect which ATS platform the current page belongs to
   * Returns null if on excluded platform or unknown
   */
  function detectPlatform() {
    // First check if excluded (Lever/Ashby)
    if (isExcludedPlatform()) {
      console.log('[FrogHire] Excluded platform detected (Lever/Ashby) - extension inactive');
      return null;
    }

    const url = window.location.href.toLowerCase();
    const hostname = window.location.hostname.toLowerCase();

    for (const [key, platform] of Object.entries(ATS_PLATFORMS)) {
      for (const pattern of platform.patterns) {
        if (pattern.test(url) || pattern.test(hostname)) {
          console.log(`[FrogHire] Detected ATS platform: ${platform.name}`);
          return { key, ...platform };
        }
      }
    }

    console.log('[FrogHire] Unknown platform - using generic autofill');
    return { key: 'generic', name: 'Generic', selectors: {} };
  }

  /**
   * Get field selectors for the current platform
   */
  function getSelectors(platformKey) {
    const platform = ATS_PLATFORMS[platformKey];
    return platform ? platform.selectors : {};
  }

  /**
   * Add a new platform to the registry
   */
  function registerPlatform(key, config) {
    ATS_PLATFORMS[key] = config;
  }

  // Public API
  return {
    isExcludedPlatform,
    detectPlatform,
    getSelectors,
    registerPlatform,
    EXCLUDED_DOMAINS,
    ATS_PLATFORMS
  };
})();

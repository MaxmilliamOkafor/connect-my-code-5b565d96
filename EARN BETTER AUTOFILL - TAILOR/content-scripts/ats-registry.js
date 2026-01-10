// ==== ATS Registry Module ====
// Configurable registry of ATS platforms with field mappings
// Lever and Ashby are EXPLICITLY EXCLUDED

(function() {
  'use strict';

  // ============================================================
  // EXCLUDED PLATFORMS - Extension becomes inert on these sites
  // ============================================================
  const EXCLUDED_PLATFORMS = [
    { name: 'Lever', patterns: [/lever\.co/i, /jobs\.lever\.co/i, /\.lever\./i] },
    { name: 'Ashby', patterns: [/ashbyhq\.com/i, /jobs\.ashby/i, /\.ashby\./i] }
  ];

  // Check if current page is on an excluded platform
  function isExcludedPlatform() {
    const url = window.location.href.toLowerCase();
    const hostname = window.location.hostname.toLowerCase();
    
    for (const platform of EXCLUDED_PLATFORMS) {
      for (const pattern of platform.patterns) {
        if (pattern.test(url) || pattern.test(hostname)) {
          console.log(`[EarnBetter] ${platform.name} detected - extension disabled on this platform`);
          return true;
        }
      }
    }
    return false;
  }

  // ============================================================
  // SUPPORTED ATS PLATFORMS REGISTRY
  // ============================================================
  const ATS_REGISTRY = {
    // Workday
    workday: {
      name: 'Workday',
      patterns: [/workday\.com/i, /myworkdayjobs\.com/i],
      selectors: {
        firstName: ['input[data-automation-id="firstName"]', 'input[id*="firstName"]', 'input[name*="firstName"]'],
        lastName: ['input[data-automation-id="lastName"]', 'input[id*="lastName"]', 'input[name*="lastName"]'],
        email: ['input[data-automation-id="email"]', 'input[type="email"]', 'input[id*="email"]'],
        phone: ['input[data-automation-id="phone"]', 'input[type="tel"]', 'input[id*="phone"]'],
        address: ['input[data-automation-id="addressLine1"]', 'input[id*="address"]'],
        city: ['input[data-automation-id="city"]', 'input[id*="city"]'],
        postalCode: ['input[data-automation-id="postalCode"]', 'input[id*="postal"]', 'input[id*="zip"]'],
        resume: ['input[type="file"][data-automation-id*="resume"]', 'input[type="file"]'],
        linkedin: ['input[data-automation-id*="linkedin"]', 'input[id*="linkedin"]']
      }
    },

    // Greenhouse
    greenhouse: {
      name: 'Greenhouse',
      patterns: [/greenhouse\.io/i, /boards\.greenhouse/i],
      selectors: {
        firstName: ['input#first_name', 'input[name="job_application[first_name]"]'],
        lastName: ['input#last_name', 'input[name="job_application[last_name]"]'],
        email: ['input#email', 'input[name="job_application[email]"]'],
        phone: ['input#phone', 'input[name="job_application[phone]"]'],
        resume: ['input[type="file"]#resume', 'input[name="job_application[resume]"]'],
        coverLetter: ['textarea#cover_letter', 'input[type="file"]#cover_letter'],
        linkedin: ['input#job_application_answers_attributes_0_text_value', 'input[id*="linkedin"]']
      }
    },

    // Taleo
    taleo: {
      name: 'Taleo',
      patterns: [/taleo\.net/i, /taleor/i],
      selectors: {
        firstName: ['input[id*="FirstName"]', 'input[name*="FirstName"]'],
        lastName: ['input[id*="LastName"]', 'input[name*="LastName"]'],
        email: ['input[id*="Email"]', 'input[type="email"]'],
        phone: ['input[id*="Phone"]', 'input[type="tel"]'],
        resume: ['input[type="file"]']
      }
    },

    // SmartRecruiters
    smartrecruiters: {
      name: 'SmartRecruiters',
      patterns: [/smartrecruiters\.com/i, /jobs\.smartrecruiters/i],
      selectors: {
        firstName: ['input[name="firstName"]', 'input[id*="firstName"]'],
        lastName: ['input[name="lastName"]', 'input[id*="lastName"]'],
        email: ['input[name="email"]', 'input[type="email"]'],
        phone: ['input[name="phoneNumber"]', 'input[type="tel"]'],
        resume: ['input[type="file"]'],
        linkedin: ['input[name*="linkedin"]', 'input[id*="linkedin"]']
      }
    },

    // iCIMS
    icims: {
      name: 'iCIMS',
      patterns: [/icims\.com/i, /careers-/i],
      selectors: {
        firstName: ['input[id*="FirstName"]', 'input[name*="firstName"]'],
        lastName: ['input[id*="LastName"]', 'input[name*="lastName"]'],
        email: ['input[id*="Email"]', 'input[type="email"]'],
        phone: ['input[id*="Phone"]', 'input[type="tel"]'],
        resume: ['input[type="file"]']
      }
    },

    // SuccessFactors
    successfactors: {
      name: 'SuccessFactors',
      patterns: [/successfactors\.com/i, /successfactors\.eu/i],
      selectors: {
        firstName: ['input[id*="firstName"]', 'input[name*="firstName"]'],
        lastName: ['input[id*="lastName"]', 'input[name*="lastName"]'],
        email: ['input[id*="email"]', 'input[type="email"]'],
        phone: ['input[id*="phone"]', 'input[type="tel"]'],
        resume: ['input[type="file"]']
      }
    },

    // Jobvite
    jobvite: {
      name: 'Jobvite',
      patterns: [/jobvite\.com/i, /jobs\.jobvite/i],
      selectors: {
        firstName: ['input[name="firstName"]', 'input#firstName'],
        lastName: ['input[name="lastName"]', 'input#lastName'],
        email: ['input[name="email"]', 'input#email'],
        phone: ['input[name="phone"]', 'input#phone'],
        resume: ['input[type="file"]'],
        linkedin: ['input[name*="linkedin"]']
      }
    },

    // Teamtailor
    teamtailor: {
      name: 'Teamtailor',
      patterns: [/teamtailor\.com/i, /career\./i],
      selectors: {
        firstName: ['input[name="candidate[first_name]"]', 'input[id*="first_name"]'],
        lastName: ['input[name="candidate[last_name]"]', 'input[id*="last_name"]'],
        email: ['input[name="candidate[email]"]', 'input[type="email"]'],
        phone: ['input[name="candidate[phone]"]', 'input[type="tel"]'],
        resume: ['input[type="file"]'],
        linkedin: ['input[name*="linkedin"]']
      }
    },

    // BambooHR
    bamboohr: {
      name: 'BambooHR',
      patterns: [/bamboohr\.com/i],
      selectors: {
        firstName: ['input[name="firstName"]', 'input#firstName'],
        lastName: ['input[name="lastName"]', 'input#lastName'],
        email: ['input[name="email"]', 'input#email'],
        phone: ['input[name="phone"]', 'input#phone'],
        resume: ['input[type="file"]']
      }
    },

    // Workable
    workable: {
      name: 'Workable',
      patterns: [/workable\.com/i, /apply\.workable/i],
      selectors: {
        firstName: ['input[name="firstname"]', 'input[id*="firstname"]'],
        lastName: ['input[name="lastname"]', 'input[id*="lastname"]'],
        email: ['input[name="email"]', 'input[type="email"]'],
        phone: ['input[name="phone"]', 'input[type="tel"]'],
        resume: ['input[type="file"]'],
        linkedin: ['input[name*="linkedin"]']
      }
    },

    // LinkedIn
    linkedin: {
      name: 'LinkedIn',
      patterns: [/linkedin\.com/i],
      selectors: {
        firstName: ['input[id*="first-name"]', 'input[name*="firstName"]'],
        lastName: ['input[id*="last-name"]', 'input[name*="lastName"]'],
        email: ['input[id*="email"]', 'input[type="email"]'],
        phone: ['input[id*="phone"]', 'input[type="tel"]'],
        resume: ['input[type="file"]']
      }
    },

    // Indeed
    indeed: {
      name: 'Indeed',
      patterns: [/indeed\.com/i, /indeed\.co\.uk/i, /indeed\.ie/i],
      selectors: {
        firstName: ['input[id*="firstName"]', 'input[name*="firstName"]'],
        lastName: ['input[id*="lastName"]', 'input[name*="lastName"]'],
        email: ['input[id*="email"]', 'input[type="email"]'],
        phone: ['input[id*="phone"]', 'input[type="tel"]'],
        resume: ['input[type="file"]']
      }
    },

    // Glassdoor
    glassdoor: {
      name: 'Glassdoor',
      patterns: [/glassdoor\.com/i, /glassdoor\.co\.uk/i, /glassdoor\.ie/i],
      selectors: {
        firstName: ['input[name="firstName"]', 'input[id*="firstName"]'],
        lastName: ['input[name="lastName"]', 'input[id*="lastName"]'],
        email: ['input[name="email"]', 'input[type="email"]'],
        phone: ['input[name="phone"]', 'input[type="tel"]'],
        resume: ['input[type="file"]']
      }
    },

    // UK Job Boards
    reed: {
      name: 'Reed',
      patterns: [/reed\.co\.uk/i],
      selectors: {
        firstName: ['input[name="firstName"]', 'input#firstName'],
        lastName: ['input[name="lastName"]', 'input#lastName'],
        email: ['input[name="email"]', 'input[type="email"]'],
        phone: ['input[name="phone"]', 'input[type="tel"]'],
        resume: ['input[type="file"]']
      }
    },

    totaljobs: {
      name: 'TotalJobs',
      patterns: [/totaljobs\.com/i],
      selectors: {
        firstName: ['input[name="firstName"]', 'input#firstName'],
        lastName: ['input[name="lastName"]', 'input#lastName'],
        email: ['input[name="email"]', 'input[type="email"]'],
        phone: ['input[name="phone"]', 'input[type="tel"]'],
        resume: ['input[type="file"]']
      }
    },

    cvlibrary: {
      name: 'CV-Library',
      patterns: [/cvlibrary\.co\.uk/i],
      selectors: {
        firstName: ['input[name="first_name"]', 'input#first_name'],
        lastName: ['input[name="surname"]', 'input#surname'],
        email: ['input[name="email"]', 'input[type="email"]'],
        phone: ['input[name="phone"]', 'input[type="tel"]'],
        resume: ['input[type="file"]']
      }
    },

    // Ireland Job Boards
    jobsie: {
      name: 'Jobs.ie',
      patterns: [/jobs\.ie/i],
      selectors: {
        firstName: ['input[name="firstName"]', 'input#firstName'],
        lastName: ['input[name="lastName"]', 'input#lastName'],
        email: ['input[name="email"]', 'input[type="email"]'],
        phone: ['input[name="phone"]', 'input[type="tel"]'],
        resume: ['input[type="file"]']
      }
    },

    irishjobs: {
      name: 'IrishJobs',
      patterns: [/irishjobs\.ie/i],
      selectors: {
        firstName: ['input[name="firstName"]', 'input#firstName'],
        lastName: ['input[name="lastName"]', 'input#lastName'],
        email: ['input[name="email"]', 'input[type="email"]'],
        phone: ['input[name="phone"]', 'input[type="tel"]'],
        resume: ['input[type="file"]']
      }
    },

    // Oracle/Taleo Cloud
    oracle: {
      name: 'Oracle Cloud',
      patterns: [/oracle\.com/i, /oraclecloud\.com/i],
      selectors: {
        firstName: ['input[id*="firstName"]', 'input[name*="firstName"]'],
        lastName: ['input[id*="lastName"]', 'input[name*="lastName"]'],
        email: ['input[id*="email"]', 'input[type="email"]'],
        phone: ['input[id*="phone"]', 'input[type="tel"]'],
        resume: ['input[type="file"]']
      }
    },

    // Recruitee
    recruitee: {
      name: 'Recruitee',
      patterns: [/recruitee\.com/i],
      selectors: {
        firstName: ['input[name="first_name"]', 'input#first_name'],
        lastName: ['input[name="last_name"]', 'input#last_name'],
        email: ['input[name="email"]', 'input[type="email"]'],
        phone: ['input[name="phone"]', 'input[type="tel"]'],
        resume: ['input[type="file"]']
      }
    },

    // Breezy HR
    breezy: {
      name: 'Breezy HR',
      patterns: [/breezy\.hr/i],
      selectors: {
        firstName: ['input[name="name.first"]', 'input#firstName'],
        lastName: ['input[name="name.last"]', 'input#lastName'],
        email: ['input[name="email"]', 'input[type="email"]'],
        phone: ['input[name="phone"]', 'input[type="tel"]'],
        resume: ['input[type="file"]']
      }
    },

    // JazzHR
    jazz: {
      name: 'JazzHR',
      patterns: [/jazz\.co/i, /applytojob\.com/i],
      selectors: {
        firstName: ['input[name="first_name"]', 'input#first_name'],
        lastName: ['input[name="last_name"]', 'input#last_name'],
        email: ['input[name="email"]', 'input[type="email"]'],
        phone: ['input[name="phone"]', 'input[type="tel"]'],
        resume: ['input[type="file"]']
      }
    }
  };

  // Detect current ATS platform
  function detectATS() {
    const url = window.location.href.toLowerCase();
    const hostname = window.location.hostname.toLowerCase();

    for (const [key, config] of Object.entries(ATS_REGISTRY)) {
      for (const pattern of config.patterns) {
        if (pattern.test(url) || pattern.test(hostname)) {
          console.log(`[EarnBetter] Detected ATS: ${config.name}`);
          return { key, config };
        }
      }
    }
    return null;
  }

  // Export to global scope
  window.EarnBetterATS = {
    isExcludedPlatform,
    detectATS,
    registry: ATS_REGISTRY,
    excludedPlatforms: EXCLUDED_PLATFORMS
  };

  console.log('[EarnBetter] ATS Registry loaded - supports', Object.keys(ATS_REGISTRY).length, 'platforms');
  console.log('[EarnBetter] Excluded platforms:', EXCLUDED_PLATFORMS.map(p => p.name).join(', '));

})();

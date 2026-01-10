/**
 * ==== AUTOFILL ENGINE ====
 * Universal autofill with semantic field detection for all ATS platforms.
 * Works on known platforms via ATS_REGISTRY and unknown forms via generic matching.
 */

window.FrogHireAutofillEngine = (function() {
  'use strict';

  // ========================================
  // FIELD DETECTION PATTERNS
  // ========================================
  const FIELD_PATTERNS = {
    firstName: {
      labels: ['first name', 'given name', 'forename', 'first', 'fname', 'prénom'],
      names: ['firstName', 'first_name', 'fname', 'givenName', 'given_name', 'forename'],
      ids: ['firstName', 'first-name', 'first_name', 'fname', 'givenName'],
      placeholders: ['first name', 'given name', 'john', 'enter first name']
    },
    lastName: {
      labels: ['last name', 'family name', 'surname', 'last', 'lname', 'nom'],
      names: ['lastName', 'last_name', 'lname', 'familyName', 'family_name', 'surname'],
      ids: ['lastName', 'last-name', 'last_name', 'lname', 'surname', 'familyName'],
      placeholders: ['last name', 'family name', 'surname', 'doe', 'enter last name']
    },
    fullName: {
      labels: ['full name', 'name', 'your name', 'applicant name', 'candidate name'],
      names: ['fullName', 'full_name', 'name', 'candidateName', 'applicantName'],
      ids: ['fullName', 'full-name', 'name', 'applicant-name'],
      placeholders: ['full name', 'your name', 'john doe', 'enter your name']
    },
    email: {
      labels: ['email', 'e-mail', 'email address', 'work email', 'personal email'],
      names: ['email', 'emailAddress', 'email_address', 'userEmail', 'workEmail'],
      ids: ['email', 'emailAddress', 'email-address', 'user-email'],
      placeholders: ['email', 'your email', 'john@example.com', 'enter email'],
      types: ['email']
    },
    phone: {
      labels: ['phone', 'telephone', 'mobile', 'cell', 'contact number', 'phone number'],
      names: ['phone', 'phoneNumber', 'phone_number', 'telephone', 'mobile', 'cell'],
      ids: ['phone', 'phoneNumber', 'phone-number', 'telephone', 'mobile'],
      placeholders: ['phone', 'phone number', 'mobile number', '+1', 'enter phone'],
      types: ['tel']
    },
    linkedin: {
      labels: ['linkedin', 'linkedin url', 'linkedin profile', 'linkedin link'],
      names: ['linkedin', 'linkedinUrl', 'linkedin_url', 'linkedInProfile'],
      ids: ['linkedin', 'linkedin-url', 'linkedinProfile'],
      placeholders: ['linkedin.com/in/', 'linkedin url', 'your linkedin', 'linkedin profile']
    },
    website: {
      labels: ['website', 'portfolio', 'personal website', 'personal site', 'github'],
      names: ['website', 'portfolioUrl', 'personalWebsite', 'github', 'portfolio'],
      ids: ['website', 'portfolio', 'personal-website', 'github'],
      placeholders: ['website', 'portfolio url', 'github.com', 'your website']
    },
    address: {
      labels: ['address', 'street address', 'address line 1', 'street'],
      names: ['address', 'streetAddress', 'address1', 'addressLine1', 'street'],
      ids: ['address', 'street-address', 'address-line-1', 'address1'],
      placeholders: ['street address', 'address', 'enter address', '123 main st']
    },
    city: {
      labels: ['city', 'town', 'city/town'],
      names: ['city', 'cityName', 'town'],
      ids: ['city', 'cityName', 'town'],
      placeholders: ['city', 'town', 'new york', 'london', 'enter city']
    },
    state: {
      labels: ['state', 'province', 'region', 'county', 'state/province'],
      names: ['state', 'stateProvince', 'province', 'region', 'county'],
      ids: ['state', 'stateProvince', 'province', 'region'],
      placeholders: ['state', 'province', 'county', 'ca', 'ny']
    },
    postalCode: {
      labels: ['postal code', 'zip code', 'zip', 'postcode', 'post code'],
      names: ['postalCode', 'zipCode', 'zip', 'postcode'],
      ids: ['postalCode', 'zip-code', 'zip', 'postcode'],
      placeholders: ['postal code', 'zip code', 'zip', '10001', 'sw1a']
    },
    country: {
      labels: ['country', 'nation', 'country/region'],
      names: ['country', 'countryCode', 'nation'],
      ids: ['country', 'countryCode', 'nation'],
      placeholders: ['country', 'select country', 'united states', 'united kingdom']
    },
    location: {
      labels: ['location', 'current location', 'where are you located', 'your location'],
      names: ['location', 'currentLocation', 'userLocation'],
      ids: ['location', 'current-location', 'user-location'],
      placeholders: ['location', 'city, state', 'new york, ny', 'london, uk']
    },
    resume: {
      labels: ['resume', 'cv', 'curriculum vitae', 'upload resume', 'attach resume'],
      names: ['resume', 'cv', 'resumeFile', 'cvFile'],
      ids: ['resume', 'cv', 'resume-upload', 'cv-upload'],
      accept: ['.pdf', '.doc', '.docx', 'application/pdf']
    },
    coverLetter: {
      labels: ['cover letter', 'covering letter', 'letter of interest'],
      names: ['coverLetter', 'cover_letter', 'coveringLetter'],
      ids: ['coverLetter', 'cover-letter', 'covering-letter'],
      placeholders: ['cover letter', 'why are you interested']
    },
    experience: {
      labels: ['experience', 'work experience', 'years of experience', 'total experience'],
      names: ['experience', 'yearsExperience', 'workExperience', 'totalExperience'],
      ids: ['experience', 'years-experience', 'work-experience'],
      placeholders: ['years of experience', 'total experience', '5 years']
    },
    education: {
      labels: ['education', 'highest education', 'degree', 'qualification'],
      names: ['education', 'highestEducation', 'degree', 'qualification'],
      ids: ['education', 'highest-education', 'degree'],
      placeholders: ['education level', 'degree', 'bachelor\'s', 'master\'s']
    },
    salary: {
      labels: ['salary', 'expected salary', 'desired salary', 'compensation', 'pay'],
      names: ['salary', 'expectedSalary', 'desiredSalary', 'compensation'],
      ids: ['salary', 'expected-salary', 'desired-salary'],
      placeholders: ['expected salary', 'desired compensation', '100000']
    },
    startDate: {
      labels: ['start date', 'available from', 'earliest start', 'when can you start'],
      names: ['startDate', 'availableFrom', 'earliestStart', 'availabilityDate'],
      ids: ['startDate', 'start-date', 'available-from'],
      placeholders: ['start date', 'mm/dd/yyyy', 'immediately', '2 weeks']
    },
    authorization: {
      labels: ['work authorization', 'authorized to work', 'legally authorized', 'right to work'],
      names: ['workAuthorization', 'authorizedToWork', 'rightToWork'],
      ids: ['workAuthorization', 'work-authorization', 'right-to-work'],
      values: ['yes', 'authorized', 'eligible']
    },
    sponsorship: {
      labels: ['sponsorship', 'visa sponsorship', 'require sponsorship', 'need sponsorship'],
      names: ['sponsorship', 'visaSponsorship', 'requireSponsorship'],
      ids: ['sponsorship', 'visa-sponsorship', 'require-sponsorship'],
      values: ['no', 'not required']
    }
  };

  /**
   * Find a form field using semantic matching
   */
  function findField(fieldType, container = document) {
    const patterns = FIELD_PATTERNS[fieldType];
    if (!patterns) return null;

    // Try type attribute first (for email, tel)
    if (patterns.types) {
      for (const type of patterns.types) {
        const el = container.querySelector(`input[type="${type}"]`);
        if (el && isVisible(el)) return el;
      }
    }

    // Try by name attribute
    for (const name of patterns.names || []) {
      const el = container.querySelector(`input[name="${name}"], textarea[name="${name}"], select[name="${name}"]`);
      if (el && isVisible(el)) return el;
      
      // Partial match
      const partial = container.querySelector(`input[name*="${name}"], textarea[name*="${name}"], select[name*="${name}"]`);
      if (partial && isVisible(partial)) return partial;
    }

    // Try by ID
    for (const id of patterns.ids || []) {
      const el = container.querySelector(`#${id}`);
      if (el && isVisible(el)) return el;
      
      // Partial match
      const partial = container.querySelector(`[id*="${id}"]`);
      if (partial && isVisible(partial) && isInputElement(partial)) return partial;
    }

    // Try by label text
    for (const labelText of patterns.labels || []) {
      const labels = container.querySelectorAll('label');
      for (const label of labels) {
        if (label.textContent.toLowerCase().includes(labelText.toLowerCase())) {
          // Find associated input
          const forId = label.getAttribute('for');
          if (forId) {
            const el = container.querySelector(`#${forId}`);
            if (el && isVisible(el)) return el;
          }
          // Find input inside label
          const input = label.querySelector('input, textarea, select');
          if (input && isVisible(input)) return input;
          // Find adjacent input
          const next = label.nextElementSibling;
          if (next && isInputElement(next) && isVisible(next)) return next;
        }
      }
    }

    // Try by placeholder
    for (const placeholder of patterns.placeholders || []) {
      const el = container.querySelector(`input[placeholder*="${placeholder}" i], textarea[placeholder*="${placeholder}" i]`);
      if (el && isVisible(el)) return el;
    }

    // Try by aria-label
    for (const label of patterns.labels || []) {
      const el = container.querySelector(`[aria-label*="${label}" i]`);
      if (el && isVisible(el) && isInputElement(el)) return el;
    }

    return null;
  }

  /**
   * Check if element is an input-like element
   */
  function isInputElement(el) {
    return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT';
  }

  /**
   * Check if element is visible
   */
  function isVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0' &&
           el.offsetParent !== null;
  }

  /**
   * Set value on a form field with proper event dispatching
   */
  function setFieldValue(element, value, options = {}) {
    if (!element || !value) return false;

    const tagName = element.tagName.toLowerCase();
    const type = element.type?.toLowerCase();

    try {
      // Focus the element first
      element.focus();

      if (tagName === 'select') {
        // Handle select dropdown
        const optionToSelect = Array.from(element.options).find(opt => 
          opt.value.toLowerCase().includes(value.toLowerCase()) ||
          opt.textContent.toLowerCase().includes(value.toLowerCase())
        );
        if (optionToSelect) {
          element.value = optionToSelect.value;
          element.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
      } else if (type === 'checkbox' || type === 'radio') {
        // Handle checkbox/radio
        const shouldCheck = value === true || value === 'true' || value === 'yes' || value === '1';
        if (element.checked !== shouldCheck) {
          element.checked = shouldCheck;
          element.dispatchEvent(new Event('change', { bubbles: true }));
        }
        return true;
      } else if (type === 'file') {
        // File inputs handled separately
        console.log('[FrogHire] File input detected - requires manual upload');
        return false;
      } else {
        // Standard text input
        element.value = value;
        
        // Dispatch input events for React/Vue/Angular compatibility
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        element.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
        
        // Handle React synthetic events
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype, 'value'
        )?.set;
        const nativeTextareaValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLTextAreaElement.prototype, 'value'
        )?.set;
        
        if (tagName === 'input' && nativeInputValueSetter) {
          nativeInputValueSetter.call(element, value);
          element.dispatchEvent(new Event('input', { bubbles: true }));
        } else if (tagName === 'textarea' && nativeTextareaValueSetter) {
          nativeTextareaValueSetter.call(element, value);
          element.dispatchEvent(new Event('input', { bubbles: true }));
        }

        return true;
      }
    } catch (error) {
      console.error('[FrogHire] Error setting field value:', error);
      return false;
    }

    element.blur();
    return false;
  }

  /**
   * Autofill a form with user profile data
   */
  function autofillForm(profileData, container = document) {
    const results = {
      filled: [],
      skipped: [],
      failed: []
    };

    // Map profile fields to form fields
    const fieldMappings = {
      firstName: profileData.firstName || profileData.first_name,
      lastName: profileData.lastName || profileData.last_name,
      fullName: profileData.fullName || `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim(),
      email: profileData.email,
      phone: profileData.phone || profileData.phoneNumber,
      linkedin: profileData.linkedin || profileData.linkedinUrl,
      website: profileData.website || profileData.portfolio,
      address: profileData.address || profileData.streetAddress,
      city: profileData.city,
      state: profileData.state || profileData.province,
      postalCode: profileData.postalCode || profileData.zipCode,
      country: profileData.country,
      location: profileData.location || `${profileData.city || ''}, ${profileData.state || ''}`.trim(),
      experience: profileData.yearsExperience || profileData.experience,
      education: profileData.education || profileData.highestEducation,
      salary: profileData.expectedSalary || profileData.salary,
      authorization: profileData.workAuthorization || 'yes',
      sponsorship: profileData.requiresSponsorship || 'no'
    };

    for (const [fieldType, value] of Object.entries(fieldMappings)) {
      if (!value) {
        results.skipped.push(fieldType);
        continue;
      }

      const field = findField(fieldType, container);
      if (!field) {
        results.skipped.push(fieldType);
        continue;
      }

      const success = setFieldValue(field, value);
      if (success) {
        results.filled.push(fieldType);
      } else {
        results.failed.push(fieldType);
      }
    }

    console.log('[FrogHire] Autofill results:', results);
    return results;
  }

  /**
   * Detect all fillable fields on the page
   */
  function detectFields(container = document) {
    const detectedFields = {};

    for (const fieldType of Object.keys(FIELD_PATTERNS)) {
      const field = findField(fieldType, container);
      if (field) {
        detectedFields[fieldType] = {
          element: field,
          id: field.id,
          name: field.name,
          type: field.type,
          tagName: field.tagName
        };
      }
    }

    return detectedFields;
  }

  // Public API
  return {
    findField,
    setFieldValue,
    autofillForm,
    detectFields,
    FIELD_PATTERNS
  };
})();

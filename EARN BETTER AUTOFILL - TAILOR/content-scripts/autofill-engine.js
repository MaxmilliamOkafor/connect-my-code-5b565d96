// ==== Universal Autofill Engine ====
// Generic fallback autofill for unknown forms using semantic matching
// Works on any job application form by detecting field types

(function() {
  'use strict';

  // ============================================================
  // FIELD DETECTION PATTERNS
  // ============================================================
  const FIELD_PATTERNS = {
    firstName: {
      labels: ['first name', 'given name', 'forename', 'first', 'fname'],
      names: ['firstName', 'first_name', 'fname', 'givenName', 'given_name'],
      ids: ['firstName', 'first-name', 'first_name', 'fname', 'givenName'],
      placeholders: ['first name', 'given name', 'john'],
      types: ['text']
    },
    lastName: {
      labels: ['last name', 'family name', 'surname', 'last', 'lname'],
      names: ['lastName', 'last_name', 'lname', 'familyName', 'family_name', 'surname'],
      ids: ['lastName', 'last-name', 'last_name', 'lname', 'surname'],
      placeholders: ['last name', 'family name', 'surname', 'doe'],
      types: ['text']
    },
    fullName: {
      labels: ['full name', 'name', 'your name', 'applicant name'],
      names: ['name', 'fullName', 'full_name', 'applicantName'],
      ids: ['name', 'fullName', 'full-name', 'applicant-name'],
      placeholders: ['full name', 'your name', 'john doe'],
      types: ['text']
    },
    email: {
      labels: ['email', 'e-mail', 'email address', 'e-mail address'],
      names: ['email', 'emailAddress', 'email_address', 'userEmail'],
      ids: ['email', 'emailAddress', 'email-address', 'user-email'],
      placeholders: ['email', 'your email', 'email address', 'john@example.com'],
      types: ['email', 'text']
    },
    phone: {
      labels: ['phone', 'telephone', 'mobile', 'cell', 'phone number', 'contact number'],
      names: ['phone', 'telephone', 'mobile', 'phoneNumber', 'phone_number', 'tel'],
      ids: ['phone', 'telephone', 'mobile', 'phone-number', 'tel'],
      placeholders: ['phone', 'mobile', 'telephone', '+1', '123'],
      types: ['tel', 'text', 'number']
    },
    address: {
      labels: ['address', 'street address', 'address line', 'street'],
      names: ['address', 'streetAddress', 'street_address', 'addressLine1', 'address1'],
      ids: ['address', 'street-address', 'address-line-1', 'address1'],
      placeholders: ['address', 'street address', '123 main'],
      types: ['text']
    },
    city: {
      labels: ['city', 'town', 'city/town'],
      names: ['city', 'town', 'locality'],
      ids: ['city', 'town', 'locality'],
      placeholders: ['city', 'town', 'new york'],
      types: ['text']
    },
    state: {
      labels: ['state', 'province', 'region', 'county'],
      names: ['state', 'province', 'region', 'county', 'administrativeArea'],
      ids: ['state', 'province', 'region', 'county'],
      placeholders: ['state', 'province', 'california'],
      types: ['text']
    },
    postalCode: {
      labels: ['zip', 'postal', 'postcode', 'zip code', 'postal code'],
      names: ['zip', 'zipCode', 'zip_code', 'postalCode', 'postal_code', 'postcode'],
      ids: ['zip', 'zipCode', 'zip-code', 'postal-code', 'postcode'],
      placeholders: ['zip', 'postal', '12345', 'sw1a'],
      types: ['text', 'number']
    },
    country: {
      labels: ['country', 'nation', 'country/region'],
      names: ['country', 'nation', 'countryCode', 'country_code'],
      ids: ['country', 'nation', 'country-code'],
      placeholders: ['country', 'select country'],
      types: ['text']
    },
    linkedin: {
      labels: ['linkedin', 'linkedin url', 'linkedin profile'],
      names: ['linkedin', 'linkedinUrl', 'linkedin_url', 'linkedinProfile'],
      ids: ['linkedin', 'linkedin-url', 'linkedin-profile'],
      placeholders: ['linkedin', 'linkedin.com/in/', 'profile url'],
      types: ['url', 'text']
    },
    website: {
      labels: ['website', 'portfolio', 'personal website', 'portfolio url'],
      names: ['website', 'portfolio', 'websiteUrl', 'portfolioUrl'],
      ids: ['website', 'portfolio', 'website-url', 'portfolio-url'],
      placeholders: ['website', 'portfolio', 'https://'],
      types: ['url', 'text']
    },
    github: {
      labels: ['github', 'github url', 'github profile'],
      names: ['github', 'githubUrl', 'github_url'],
      ids: ['github', 'github-url', 'github-profile'],
      placeholders: ['github', 'github.com/'],
      types: ['url', 'text']
    },
    currentCompany: {
      labels: ['current company', 'current employer', 'employer', 'company'],
      names: ['currentCompany', 'current_company', 'employer', 'company'],
      ids: ['current-company', 'currentCompany', 'employer'],
      placeholders: ['current company', 'employer'],
      types: ['text']
    },
    currentTitle: {
      labels: ['current title', 'job title', 'current position', 'title', 'role'],
      names: ['currentTitle', 'current_title', 'jobTitle', 'title', 'position'],
      ids: ['current-title', 'job-title', 'title', 'position'],
      placeholders: ['current title', 'job title', 'software engineer'],
      types: ['text']
    },
    yearsExperience: {
      labels: ['years of experience', 'experience', 'years experience', 'total experience'],
      names: ['yearsExperience', 'years_experience', 'experience', 'totalExperience'],
      ids: ['years-experience', 'experience', 'years-exp'],
      placeholders: ['years', 'experience'],
      types: ['number', 'text']
    },
    salary: {
      labels: ['salary', 'expected salary', 'salary expectation', 'compensation'],
      names: ['salary', 'expectedSalary', 'salaryExpectation', 'compensation'],
      ids: ['salary', 'expected-salary', 'compensation'],
      placeholders: ['salary', 'expected salary', '$'],
      types: ['number', 'text']
    },
    startDate: {
      labels: ['start date', 'availability', 'available from', 'earliest start'],
      names: ['startDate', 'start_date', 'availability', 'availableFrom'],
      ids: ['start-date', 'availability', 'available-from'],
      placeholders: ['start date', 'availability'],
      types: ['date', 'text']
    },
    coverLetter: {
      labels: ['cover letter', 'letter', 'motivation', 'why interested'],
      names: ['coverLetter', 'cover_letter', 'letter', 'motivation'],
      ids: ['cover-letter', 'coverLetter', 'motivation'],
      placeholders: ['cover letter', 'tell us about'],
      types: ['textarea']
    },
    resume: {
      labels: ['resume', 'cv', 'curriculum vitae', 'upload resume'],
      names: ['resume', 'cv', 'resumeFile', 'cvFile'],
      ids: ['resume', 'cv', 'resume-upload', 'cv-upload'],
      types: ['file']
    }
  };

  // ============================================================
  // FIELD DETECTION LOGIC
  // ============================================================
  
  function findLabel(input) {
    // Try explicit label
    if (input.id) {
      const label = document.querySelector(`label[for="${input.id}"]`);
      if (label) return label.textContent.toLowerCase().trim();
    }

    // Try parent label
    const parentLabel = input.closest('label');
    if (parentLabel) return parentLabel.textContent.toLowerCase().trim();

    // Try preceding label
    let prev = input.previousElementSibling;
    while (prev) {
      if (prev.tagName === 'LABEL') return prev.textContent.toLowerCase().trim();
      prev = prev.previousElementSibling;
    }

    // Try aria-label
    if (input.getAttribute('aria-label')) {
      return input.getAttribute('aria-label').toLowerCase().trim();
    }

    // Try aria-labelledby
    const labelledBy = input.getAttribute('aria-labelledby');
    if (labelledBy) {
      const labelEl = document.getElementById(labelledBy);
      if (labelEl) return labelEl.textContent.toLowerCase().trim();
    }

    return '';
  }

  function detectFieldType(input) {
    const name = (input.name || '').toLowerCase();
    const id = (input.id || '').toLowerCase();
    const placeholder = (input.placeholder || '').toLowerCase();
    const type = (input.type || 'text').toLowerCase();
    const label = findLabel(input);
    const autocomplete = (input.getAttribute('autocomplete') || '').toLowerCase();

    // Check each field pattern
    for (const [fieldType, patterns] of Object.entries(FIELD_PATTERNS)) {
      // Check type match (for file inputs)
      if (patterns.types.includes(type)) {
        // Check labels
        if (patterns.labels.some(l => label.includes(l))) return fieldType;
        
        // Check name attribute
        if (patterns.names.some(n => name.includes(n.toLowerCase()))) return fieldType;
        
        // Check id attribute
        if (patterns.ids.some(i => id.includes(i.toLowerCase()))) return fieldType;
        
        // Check placeholder
        if (patterns.placeholders.some(p => placeholder.includes(p))) return fieldType;
      }
    }

    // Check autocomplete attribute as fallback
    const autocompleteMap = {
      'given-name': 'firstName',
      'family-name': 'lastName',
      'name': 'fullName',
      'email': 'email',
      'tel': 'phone',
      'street-address': 'address',
      'address-line1': 'address',
      'locality': 'city',
      'region': 'state',
      'postal-code': 'postalCode',
      'country': 'country',
      'country-name': 'country',
      'url': 'website'
    };

    if (autocompleteMap[autocomplete]) {
      return autocompleteMap[autocomplete];
    }

    return null;
  }

  // ============================================================
  // FORM DETECTION
  // ============================================================
  
  function detectForms() {
    const forms = [];
    
    // Find all forms on the page
    document.querySelectorAll('form').forEach(form => {
      const inputs = form.querySelectorAll('input, textarea, select');
      if (inputs.length > 0) {
        forms.push({
          element: form,
          inputs: Array.from(inputs)
        });
      }
    });

    // Also find orphan inputs (not in a form)
    const allInputs = document.querySelectorAll('input, textarea, select');
    const orphanInputs = Array.from(allInputs).filter(input => !input.closest('form'));
    
    if (orphanInputs.length > 0) {
      forms.push({
        element: document.body,
        inputs: orphanInputs,
        isOrphan: true
      });
    }

    return forms;
  }

  function mapFormFields(form) {
    const fieldMap = {};
    
    form.inputs.forEach(input => {
      const fieldType = detectFieldType(input);
      if (fieldType) {
        if (!fieldMap[fieldType]) {
          fieldMap[fieldType] = [];
        }
        fieldMap[fieldType].push(input);
      }
    });

    return fieldMap;
  }

  // ============================================================
  // AUTOFILL ENGINE
  // ============================================================
  
  function fillField(input, value) {
    if (!input || !value) return false;

    try {
      // Focus the input
      input.focus();

      // Set the value
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value'
      )?.set || Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype, 'value'
      )?.set;

      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(input, value);
      } else {
        input.value = value;
      }

      // Trigger events
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));

      // Blur the input
      input.blur();

      console.log(`[EarnBetter] Filled ${input.name || input.id}: ${value.substring(0, 20)}...`);
      return true;
    } catch (e) {
      console.error('[EarnBetter] Error filling field:', e);
      return false;
    }
  }

  function fillSelect(select, value) {
    if (!select || !value) return false;

    try {
      const options = Array.from(select.options);
      
      // Find matching option
      const match = options.find(opt => 
        opt.value.toLowerCase() === value.toLowerCase() ||
        opt.text.toLowerCase().includes(value.toLowerCase()) ||
        value.toLowerCase().includes(opt.text.toLowerCase())
      );

      if (match) {
        select.value = match.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        console.log(`[EarnBetter] Selected ${select.name || select.id}: ${match.text}`);
        return true;
      }

      return false;
    } catch (e) {
      console.error('[EarnBetter] Error filling select:', e);
      return false;
    }
  }

  function autofillForm(form, userData) {
    const fieldMap = mapFormFields(form);
    let filledCount = 0;

    const dataMapping = {
      firstName: userData.firstName,
      lastName: userData.lastName,
      fullName: `${userData.firstName} ${userData.lastName}`,
      email: userData.email,
      phone: userData.phone,
      address: userData.address,
      city: userData.city,
      state: userData.state,
      postalCode: userData.postalCode || userData.zipCode,
      country: userData.country,
      linkedin: userData.linkedin,
      website: userData.website,
      github: userData.github,
      currentCompany: userData.currentCompany,
      currentTitle: userData.currentTitle,
      yearsExperience: userData.yearsExperience
    };

    for (const [fieldType, inputs] of Object.entries(fieldMap)) {
      const value = dataMapping[fieldType];
      if (value && inputs.length > 0) {
        const input = inputs[0]; // Use first matching input
        
        if (input.tagName === 'SELECT') {
          if (fillSelect(input, value)) filledCount++;
        } else {
          if (fillField(input, value)) filledCount++;
        }
      }
    }

    return filledCount;
  }

  // ============================================================
  // PUBLIC API
  // ============================================================
  
  window.EarnBetterAutofill = {
    detectForms,
    mapFormFields,
    detectFieldType,
    fillField,
    fillSelect,
    autofillForm,
    patterns: FIELD_PATTERNS
  };

  console.log('[EarnBetter] Universal Autofill Engine loaded');

})();

const DISPOSABLE_EMAIL_DOMAINS = [
    'tempmail.com', 'temp-mail.org', 'guerrillamail.com', 'mailinator.com',
    '10minutemail.com', 'throwaway.email', 'yopmail.com', 'getnada.com',
    'maildrop.cc', 'trashmail.com', 'fakeinbox.com', 'tempr.email',
    'mohmal.com', 'dispostable.com', 'emailondeck.com', 'temp-mail.io',
    'guerrillamailblock.com', 'sharklasers.com', 'grr.la', 'spam4.me',
    'getairmail.com', 'emailtemporanea.net', 'mytemp.email', 'tmpnator.live',
    'tempinbox.com', 'mintemail.com', 'jetable.org', 'mailnesia.com',
    'anonymbox.com', 'binkmail.com', 'bobmail.info', 'dropmail.me',
    'fakemail.net', 'imgof.com', 'moakt.com', 'tmail.com',
  ];
  
  /**
   * Validates if email is not from a temporary/disposable email service
   */
  export function isValidEmail(email: string): { valid: boolean; error?: string } {
    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, error: 'Invalid email format' };
    }
  
    // Extract domain
    const domain = email.split('@')[1]?.toLowerCase();
    
    // Check if it's a disposable email
    if (DISPOSABLE_EMAIL_DOMAINS.includes(domain)) {
      return { 
        valid: false, 
        error: 'Temporary email addresses are not allowed. Please use your professional or personal email.' 
      };
    }
  
    // Check for common patterns of temp emails
    const tempPatterns = ['temp', 'fake', 'trash', 'disposable', 'throwaway', 'spam'];
    for (const pattern of tempPatterns) {
      if (domain.includes(pattern)) {
        return { 
          valid: false, 
          error: 'Temporary email addresses are not allowed. Please use your professional or personal email.' 
        };
      }
    }
  
    return { valid: true };
  }
  
  /**
   * Validates phone number format
   * Supports international formats: +1234567890, (123) 456-7890, 123-456-7890, etc.
   */
  export function isValidPhoneNumber(phone: string): { valid: boolean; error?: string } {
    if (!phone || phone.trim().length === 0) {
      return { valid: true }; // Phone is optional
    }
  
    // Remove all spaces, dashes, parentheses
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    
    // Check if it starts with + (international format)
    const hasPlus = cleanPhone.startsWith('+');
    const digits = cleanPhone.replace(/\+/g, '');
    
    // Check if all remaining characters are digits
    if (!/^\d+$/.test(digits)) {
      return { 
        valid: false, 
        error: 'Phone number can only contain digits, spaces, dashes, and parentheses' 
      };
    }
  
    // Check length (international: 10-15 digits)
    if (digits.length < 10 || digits.length > 15) {
      return { 
        valid: false, 
        error: 'Phone number must be between 10 and 15 digits' 
      };
    }
  
    // Check for obviously fake numbers
    const fakePatterns = [
      /^1{10,}$/, // All 1s
      /^0{10,}$/, // All 0s
      /^9{10,}$/, // All 9s
      /^1234567890$/, // Sequential
      /^0987654321$/, // Reverse sequential
    ];
  
    for (const pattern of fakePatterns) {
      if (pattern.test(digits)) {
        return { 
          valid: false, 
          error: 'Please provide a valid phone number' 
        };
      }
    }
  
    return { valid: true };
  }
  
  /**
   * Format phone number for display
   */
  export function formatPhoneNumber(phone: string): string {
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    
    // US format: (123) 456-7890
    if (cleanPhone.length === 10) {
      return `(${cleanPhone.slice(0, 3)}) ${cleanPhone.slice(3, 6)}-${cleanPhone.slice(6)}`;
    }
    
    // International format: +1 (123) 456-7890
    if (cleanPhone.startsWith('+') && cleanPhone.length === 12) {
      return `+${cleanPhone.slice(1, 2)} (${cleanPhone.slice(2, 5)}) ${cleanPhone.slice(5, 8)}-${cleanPhone.slice(8)}`;
    }
    
    // Return as-is if format not recognized
    return phone;
  }
  
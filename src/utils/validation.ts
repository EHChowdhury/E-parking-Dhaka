/**
 * Validation utilities for E-Parking Dhaka
 */

/**
 * Validates Bangladesh mobile numbers:
 * Starts with 013, 014, 015, 016, 017, 018, 019 followed by 8 digits (total 11 digits),
 * or with optional +88 prefix.
 */
export function validateBangladeshPhone(phone: string): { isValid: boolean; normalized?: string; error?: string } {
  if (!phone || phone.trim() === '') {
    return { isValid: false, error: 'Phone number is required.' };
  }

  // Remove spaces, hyphens, and parentheses
  const cleaned = phone.trim().replace(/[\s\-\(\)]/g, '');

  // Check with +88 or 88 prefix
  let standardFormat = cleaned;
  if (standardFormat.startsWith('+8801')) {
    standardFormat = standardFormat.slice(3); // '01...'
  } else if (standardFormat.startsWith('8801')) {
    standardFormat = standardFormat.slice(2); // '01...'
  }

  const bdPhoneRegex = /^01[3-9]\d{8}$/;
  if (!bdPhoneRegex.test(standardFormat)) {
    return {
      isValid: false,
      error: 'Please enter a valid 11-digit Bangladesh mobile number (e.g. 01711223344).',
    };
  }

  return { isValid: true, normalized: standardFormat };
}

/**
 * Validates standard email address
 */
export function validateEmail(email: string): { isValid: boolean; error?: string } {
  if (!email || email.trim() === '') {
    return { isValid: false, error: 'Email address is required.' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim().toLowerCase())) {
    return { isValid: false, error: 'Please enter a valid email address.' };
  }

  return { isValid: true };
}

/**
 * Validates password strength (min 6 characters for user friendly auth)
 */
export function validatePassword(password: string): { isValid: boolean; error?: string } {
  if (!password || password.length < 6) {
    return { isValid: false, error: 'Password must be at least 6 characters long.' };
  }
  return { isValid: true };
}

/**
 * Validates full name
 */
export function validateName(name: string): { isValid: boolean; error?: string } {
  if (!name || name.trim().length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters long.' };
  }
  return { isValid: true };
}

/**
 * Validates Bangladesh vehicle number (e.g. "DHAKA METRO GA-11-2233", "DHK-11-2233")
 */
export function validateVehicleNumber(vehicleNumber: string): { isValid: boolean; error?: string } {
  if (!vehicleNumber || vehicleNumber.trim().length < 4) {
    return {
      isValid: false,
      error: 'Please enter a valid vehicle number (e.g. DHAKA METRO GA-11-2233).',
    };
  }
  return { isValid: true };
}

/**
 * Validates price field
 */
export function validatePrice(price: number | string | null | undefined): { isValid: boolean; error?: string } {
  if (price === null || price === undefined || price === '') {
    return { isValid: false, error: 'Price is required.' };
  }
  const num = typeof price === 'number' ? price : parseFloat(price);
  if (isNaN(num) || num <= 0) {
    return { isValid: false, error: 'Price must be greater than ৳0.' };
  }
  return { isValid: true };
}

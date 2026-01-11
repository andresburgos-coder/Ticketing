import * as fc from 'fast-check';

/**
 * Generator for valid email local parts (before @)
 * Includes alphanumeric characters, dots, plus signs, and hyphens
 * Ensures valid patterns by construction rather than filtering
 */
export const validLocalPartArbitrary = fc.tuple(
  // Start with alphanumeric
  fc.char().filter(c => /[a-zA-Z0-9]/.test(c)),
  // Middle part can have special chars but not consecutive dots
  fc.array(
    fc.oneof(
      fc.char().filter(c => /[a-zA-Z0-9]/.test(c)),
      fc.constant('+'),
      fc.constant('-'),
      fc.constant('_'),
      // Dot followed by alphanumeric to avoid consecutive dots
      fc.tuple(fc.constant('.'), fc.char().filter(c => /[a-zA-Z0-9]/.test(c))).map(([dot, char]) => dot + char)
    ),
    { minLength: 0, maxLength: 18 }
  ),
  // End with alphanumeric
  fc.char().filter(c => /[a-zA-Z0-9]/.test(c))
).map(([start, middle, end]) => {
  const middlePart = middle.join('');
  return start + middlePart + (middlePart.length > 0 ? end : '');
}).filter(str => str.length >= 1 && str.length <= 20);

/**
 * Generator for valid domain names
 * Simple domain format: letters/numbers + dot + TLD
 */
export const validDomainArbitrary = fc.tuple(
  fc.stringOf(fc.char().filter(c => /[a-zA-Z0-9]/.test(c)), { minLength: 1, maxLength: 15 }),
  fc.constantFrom('com', 'org', 'net', 'edu', 'gov', 'co', 'io', 'dev')
).map(([domain, tld]) => `${domain}.${tld}`);

/**
 * Generator for valid email addresses
 */
export const validEmailArbitrary = fc.tuple(
  validLocalPartArbitrary,
  validDomainArbitrary
).map(([localPart, domain]) => `${localPart}@${domain}`);

/**
 * Generator for email addresses with various case combinations
 * Used to test case normalization
 * Ensures all generated emails are valid after normalization
 */
export const mixedCaseEmailArbitrary = validEmailArbitrary.map(email => {
  const chars = email.split('');
  return chars.map(char => 
    Math.random() > 0.5 ? char.toUpperCase() : char.toLowerCase()
  ).join('');
});

/**
 * Generator for email addresses with whitespace padding
 * Used to test trimming functionality
 * Ensures all generated emails are valid after trimming
 */
export const paddedEmailArbitrary = fc.tuple(
  fc.stringOf(fc.constant(' '), { minLength: 0, maxLength: 3 }),
  validEmailArbitrary,
  fc.stringOf(fc.constant(' '), { minLength: 0, maxLength: 3 })
).map(([prefix, email, suffix]) => `${prefix}${email}${suffix}`);

/**
 * Generator for invalid email formats
 * Used to test validation
 */
export const invalidEmailArbitrary = fc.oneof(
  // Missing @
  fc.string().filter(s => !s.includes('@') && s.length > 0),
  // Missing domain
  fc.string().filter(s => s.includes('@') && s.endsWith('@')),
  // Missing local part
  fc.string().filter(s => s.startsWith('@') && s.length > 1),
  // Contains spaces
  fc.tuple(validLocalPartArbitrary, validDomainArbitrary)
    .map(([local, domain]) => `${local} space@${domain}`),
  // Missing TLD
  fc.tuple(validLocalPartArbitrary, fc.string().filter(s => !s.includes('.') && s.length > 0))
    .map(([local, domain]) => `${local}@${domain}`),
  // Empty string
  fc.constant(''),
  // Only whitespace
  fc.stringOf(fc.constant(' '), { minLength: 1, maxLength: 10 })
);

/**
 * Generator for email normalization test cases
 * Returns original and expected normalized version
 * Ensures all generated cases are valid
 */
export const emailNormalizationArbitrary = fc.oneof(
  // Mixed case emails
  mixedCaseEmailArbitrary.map(email => ({
    original: email,
    normalized: email.trim().toLowerCase()
  })),
  // Padded emails
  paddedEmailArbitrary.map(email => ({
    original: email,
    normalized: email.trim().toLowerCase()
  })),
  // Mixed case and padded
  fc.tuple(
    fc.stringOf(fc.constant(' '), { minLength: 0, maxLength: 2 }),
    mixedCaseEmailArbitrary,
    fc.stringOf(fc.constant(' '), { minLength: 0, maxLength: 2 })
  ).map(([prefix, email, suffix]) => ({
    original: `${prefix}${email}${suffix}`,
    normalized: `${prefix}${email}${suffix}`.trim().toLowerCase()
  }))
);
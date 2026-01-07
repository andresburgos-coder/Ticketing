import * as fc from 'fast-check';
import { Email } from '../../src/domain/value-objects/email.vo';
import { InvalidEmailException } from '../../src/domain/exceptions/invalid-email.exception';
import {
  validEmailArbitrary,
  mixedCaseEmailArbitrary,
  paddedEmailArbitrary,
  invalidEmailArbitrary,
  emailNormalizationArbitrary,
} from './generators/email.generator';

/**
 * Feature: ticket-sales-system
 * Property 10: Email Format Validation
 * Validates: Requirements 7.4
 *
 * *For any* email address, the Email value object should validate format,
 * normalize to lowercase, trim whitespace, and ensure equality works correctly.
 */
describe('Property 10: Email Format Validation', () => {
  const PROPERTY_CONFIG: fc.Parameters<unknown> = {
    numRuns: 100,
    verbose: fc.VerbosityLevel.VeryVerbose,
  };

  describe('Email creation and validation', () => {
    it('should create Email for any valid email format', () => {
      fc.assert(
        fc.property(validEmailArbitrary, (emailString) => {
          // Act & Assert - should not throw
          const email = Email.create(emailString);
          
          // Verify the email was created with normalized value
          expect(email.value).toBe(emailString.trim().toLowerCase());
          expect(typeof email.value).toBe('string');
          expect(email.value.length).toBeGreaterThan(0);
        }),
        PROPERTY_CONFIG,
      );
    });

    it('should reject any invalid email format', () => {
      fc.assert(
        fc.property(invalidEmailArbitrary, (invalidEmailString) => {
          // Act & Assert - should throw InvalidEmailException
          expect(() => Email.create(invalidEmailString)).toThrow(InvalidEmailException);
          expect(() => Email.create(invalidEmailString)).toThrow('Invalid email format:');
        }),
        PROPERTY_CONFIG,
      );
    });
  });

  describe('Email normalization properties', () => {
    it('should normalize any email to lowercase', () => {
      fc.assert(
        fc.property(mixedCaseEmailArbitrary, (mixedCaseEmail) => {
          // Act
          const email = Email.create(mixedCaseEmail);

          // Assert
          expect(email.value).toBe(mixedCaseEmail.trim().toLowerCase());
          expect(email.value).toBe(email.value.toLowerCase());
        }),
        PROPERTY_CONFIG,
      );
    });

    it('should trim whitespace from any email', () => {
      fc.assert(
        fc.property(paddedEmailArbitrary, (paddedEmail) => {
          // Act
          const email = Email.create(paddedEmail);

          // Assert
          const trimmed = paddedEmail.trim().toLowerCase();
          expect(email.value).toBe(trimmed);
          expect(email.value).toBe(email.value.trim());
        }),
        PROPERTY_CONFIG,
      );
    });

    it('should normalize and trim any email consistently', () => {
      fc.assert(
        fc.property(emailNormalizationArbitrary, ({ original, normalized }) => {
          // Act
          const email = Email.create(original);

          // Assert
          expect(email.value).toBe(normalized);
        }),
        PROPERTY_CONFIG,
      );
    });
  });

  describe('Email equality properties', () => {
    it('should be reflexive: email.equals(email) is always true', () => {
      fc.assert(
        fc.property(validEmailArbitrary, (emailString) => {
          // Arrange
          const email = Email.create(emailString);

          // Act & Assert
          expect(email.equals(email)).toBe(true);
        }),
        PROPERTY_CONFIG,
      );
    });

    it('should be symmetric: if email1.equals(email2) then email2.equals(email1)', () => {
      fc.assert(
        fc.property(validEmailArbitrary, validEmailArbitrary, (emailString1, emailString2) => {
          // Arrange
          const email1 = Email.create(emailString1);
          const email2 = Email.create(emailString2);

          // Act
          const equals1to2 = email1.equals(email2);
          const equals2to1 = email2.equals(email1);

          // Assert
          expect(equals1to2).toBe(equals2to1);
        }),
        PROPERTY_CONFIG,
      );
    });

    it('should be transitive: if email1.equals(email2) and email2.equals(email3) then email1.equals(email3)', () => {
      fc.assert(
        fc.property(
          validEmailArbitrary,
          validEmailArbitrary,
          validEmailArbitrary,
          (emailString1, emailString2, emailString3) => {
            // Arrange
            const email1 = Email.create(emailString1);
            const email2 = Email.create(emailString2);
            const email3 = Email.create(emailString3);

            // Only test transitivity when the precondition holds
            if (email1.equals(email2) && email2.equals(email3)) {
              // Act & Assert
              expect(email1.equals(email3)).toBe(true);
            }
            // If precondition doesn't hold, the test passes trivially
          },
        ),
        PROPERTY_CONFIG,
      );
    });

    it('should treat normalized emails as equal regardless of original format', () => {
      fc.assert(
        fc.property(validEmailArbitrary, (baseEmail) => {
          // Arrange - create variations of the same email
          const lowercase = Email.create(baseEmail.toLowerCase());
          const uppercase = Email.create(baseEmail.toUpperCase());
          const padded = Email.create(`  ${baseEmail}  `);
          const mixed = Email.create(`  ${baseEmail.toUpperCase()}  `);

          // Act & Assert - all should be equal
          expect(lowercase.equals(uppercase)).toBe(true);
          expect(lowercase.equals(padded)).toBe(true);
          expect(lowercase.equals(mixed)).toBe(true);
          expect(uppercase.equals(padded)).toBe(true);
          expect(uppercase.equals(mixed)).toBe(true);
          expect(padded.equals(mixed)).toBe(true);
        }),
        PROPERTY_CONFIG,
      );
    });
  });

  describe('Email immutability properties', () => {
    it('should be immutable: Email value cannot be changed after creation', () => {
      fc.assert(
        fc.property(validEmailArbitrary, (emailString) => {
          // Arrange
          const email = Email.create(emailString);
          const originalValue = email.value;

          // Act - try to modify (this should not be possible due to readonly)
          // We can only verify the value remains the same
          const valueAfter = email.value;

          // Assert
          expect(valueAfter).toBe(originalValue);
          expect(email.value).toBe(emailString.trim().toLowerCase());
        }),
        PROPERTY_CONFIG,
      );
    });

    it('should create new instances: Email.create() always returns different object references', () => {
      fc.assert(
        fc.property(validEmailArbitrary, (emailString) => {
          // Act
          const email1 = Email.create(emailString);
          const email2 = Email.create(emailString);

          // Assert - different object references but equal values
          expect(email1).not.toBe(email2); // Different references
          expect(email1.equals(email2)).toBe(true); // Same values
        }),
        PROPERTY_CONFIG,
      );
    });
  });
});
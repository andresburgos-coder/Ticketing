import * as fc from 'fast-check';
import { JwtService } from '@nestjs/jwt';
import {
  jwtPayloadArbitrary,
  jwtPayloadWithTimestampsArbitrary,
  expiredJwtPayloadArbitrary,
  invalidJwtTokenArbitrary,
} from './generators/jwt.generator';

/**
 * Feature: ticket-sales-system
 * Property 13: JWT Token Validity
 * Validates: Requirements 9.2, 9.3
 *
 * *For any* valid JWT payload, signing and then verifying should produce
 * an equivalent payload. Expired tokens should be rejected. Invalid tokens
 * should throw errors.
 */
describe('Property 13: JWT Token Validity', () => {
  let jwtService: JwtService;
  const JWT_SECRET = 'test-secret-key-for-property-testing';
  const PROPERTY_CONFIG: fc.Parameters<unknown> = {
    numRuns: 100,
    verbose: fc.VerbosityLevel.VeryVerbose,
  };

  beforeEach(() => {
    jwtService = new JwtService({
      secret: JWT_SECRET,
    });
  });

  describe('JWT sign and verify round-trip', () => {
    it('should sign and verify any valid JWT payload consistently', () => {
      fc.assert(
        fc.property(jwtPayloadArbitrary, (payload) => {
          // Act - sign the payload
          const token = jwtService.sign(payload, {
            secret: JWT_SECRET,
            expiresIn: '15m',
          });

          // Assert - token should be a string with 3 parts (header.payload.signature)
          expect(typeof token).toBe('string');
          expect(token.split('.').length).toBe(3);

          // Act - verify the token
          const verified = jwtService.verify(token, {
            secret: JWT_SECRET,
          });

          // Assert - verified payload should contain all original fields
          expect(verified).toHaveProperty('sub', payload.sub);
          expect(verified).toHaveProperty('email', payload.email);
          expect(verified).toHaveProperty('role', payload.role);
        }),
        PROPERTY_CONFIG,
      );
    });

    it('should preserve all payload fields through sign-verify cycle', () => {
      fc.assert(
        fc.property(jwtPayloadArbitrary, (payload) => {
          // Act
          const token = jwtService.sign(payload, {
            secret: JWT_SECRET,
            expiresIn: '15m',
          });
          const verified = jwtService.verify(token, {
            secret: JWT_SECRET,
          });

          // Assert - all original fields should be present
          expect(verified.sub).toBe(payload.sub);
          expect(verified.email).toBe(payload.email);
          expect(verified.role).toBe(payload.role);
        }),
        PROPERTY_CONFIG,
      );
    });

    it('should add iat and exp claims to any signed token', () => {
      fc.assert(
        fc.property(jwtPayloadArbitrary, (payload) => {
          // Act
          const token = jwtService.sign(payload, {
            secret: JWT_SECRET,
            expiresIn: '15m',
          });
          const verified = jwtService.verify(token, {
            secret: JWT_SECRET,
          });

          // Assert - JWT should have iat (issued at) and exp (expiration) claims
          expect(verified).toHaveProperty('iat');
          expect(verified).toHaveProperty('exp');
          expect(typeof verified.iat).toBe('number');
          expect(typeof verified.exp).toBe('number');
          // exp should be after iat
          expect(verified.exp).toBeGreaterThan(verified.iat);
        }),
        PROPERTY_CONFIG,
      );
    });
  });

  describe('JWT expiration properties', () => {
    it('should reject any expired token', () => {
      fc.assert(
        fc.property(expiredJwtPayloadArbitrary, (expiredPayload) => {
          // Act - sign without expiresIn since payload already has exp
          const token = jwtService.sign(expiredPayload, {
            secret: JWT_SECRET,
          });

          // Assert - verifying should throw because token is expired
          expect(() => {
            jwtService.verify(token, {
              secret: JWT_SECRET,
            });
          }).toThrow();
        }),
        PROPERTY_CONFIG,
      );
    });

    it('should accept any token with future expiration', () => {
      fc.assert(
        fc.property(jwtPayloadWithTimestampsArbitrary, (payload) => {
          // Act - sign without expiresIn since payload already has exp
          const token = jwtService.sign(payload, {
            secret: JWT_SECRET,
          });

          // Assert - should not throw
          expect(() => {
            jwtService.verify(token, {
              secret: JWT_SECRET,
            });
          }).not.toThrow();
        }),
        PROPERTY_CONFIG,
      );
    });
  });

  describe('JWT token format properties', () => {
    it('should produce tokens with exactly 3 parts separated by dots', () => {
      fc.assert(
        fc.property(jwtPayloadArbitrary, (payload) => {
          // Act
          const token = jwtService.sign(payload, {
            secret: JWT_SECRET,
            expiresIn: '15m',
          });

          // Assert
          const parts = token.split('.');
          expect(parts.length).toBe(3);
          expect(parts[0]).toBeTruthy(); // header
          expect(parts[1]).toBeTruthy(); // payload
          expect(parts[2]).toBeTruthy(); // signature
        }),
        PROPERTY_CONFIG,
      );
    });

    it('should produce base64-encoded header and payload', () => {
      fc.assert(
        fc.property(jwtPayloadArbitrary, (payload) => {
          // Act
          const token = jwtService.sign(payload, {
            secret: JWT_SECRET,
            expiresIn: '15m',
          });

          // Assert - decode and verify structure
          const parts = token.split('.');
          const headerB64 = parts[0] ?? '';
          const payloadB64 = parts[1] ?? '';
          
          const header = JSON.parse(Buffer.from(headerB64, 'base64').toString());
          const decodedPayload = JSON.parse(Buffer.from(payloadB64, 'base64').toString());

          expect(header).toHaveProperty('alg');
          expect(header).toHaveProperty('typ');
          expect(decodedPayload).toHaveProperty('sub', payload.sub);
          expect(decodedPayload).toHaveProperty('email', payload.email);
          expect(decodedPayload).toHaveProperty('role', payload.role);
        }),
        PROPERTY_CONFIG,
      );
    });
  });

  describe('JWT token security properties', () => {
    it('should reject any token signed with different secret', () => {
      fc.assert(
        fc.property(jwtPayloadArbitrary, (payload) => {
          // Act - sign with one secret
          const token = jwtService.sign(payload, {
            secret: JWT_SECRET,
            expiresIn: '15m',
          });

          // Assert - verifying with different secret should throw
          expect(() => {
            jwtService.verify(token, {
              secret: 'different-secret-key',
            });
          }).toThrow();
        }),
        PROPERTY_CONFIG,
      );
    });

    it('should reject any malformed token', () => {
      fc.assert(
        fc.property(invalidJwtTokenArbitrary, (malformedToken) => {
          // Act & Assert - should throw when verifying malformed token
          expect(() => {
            jwtService.verify(malformedToken, {
              secret: JWT_SECRET,
            });
          }).toThrow();
        }),
        PROPERTY_CONFIG,
      );
    });

    it('should reject any token with tampered payload', () => {
      fc.assert(
        fc.property(jwtPayloadArbitrary, (payload) => {
          // Act - sign the payload
          const token = jwtService.sign(payload, {
            secret: JWT_SECRET,
            expiresIn: '15m',
          });

          // Tamper with the payload
          const [header, payloadB64, signature] = token.split('.');
          const tamperedPayload = Buffer.from(
            JSON.stringify({ ...payload, role: 'ADMIN' })
          ).toString('base64');
          const tamperedToken = `${header}.${tamperedPayload}.${signature}`;

          // Assert - should throw because signature won't match
          expect(() => {
            jwtService.verify(tamperedToken, {
              secret: JWT_SECRET,
            });
          }).toThrow();
        }),
        PROPERTY_CONFIG,
      );
    });
  });

  describe('JWT payload immutability properties', () => {
    it('should not modify original payload when signing', () => {
      fc.assert(
        fc.property(jwtPayloadArbitrary, (payload) => {
          // Arrange - create a copy to compare
          const originalPayload = { ...payload };

          // Act
          jwtService.sign(payload, {
            secret: JWT_SECRET,
            expiresIn: '15m',
          });

          // Assert - original payload should be unchanged
          expect(payload).toEqual(originalPayload);
          expect(payload.sub).toBe(originalPayload.sub);
          expect(payload.email).toBe(originalPayload.email);
          expect(payload.role).toBe(originalPayload.role);
        }),
        PROPERTY_CONFIG,
      );
    });
  });
});

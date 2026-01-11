import * as fc from "fast-check";
import { v4 as uuidv4 } from "uuid";

/**
 * JWT Payload Generator
 * Generates valid JWT payloads for property-based testing
 */

/**
 * Generates valid user IDs (UUIDs)
 */
export const userIdArbitrary = fc.uuid().map(() => uuidv4());

/**
 * Generates valid email addresses
 */
export const emailArbitrary = fc
  .tuple(
    fc.stringMatching(/^[a-zA-Z0-9]{1,10}$/),
    fc.stringMatching(/^[a-zA-Z0-9]{1,10}$/),
  )
  .map(([local, domain]) => `${local}@${domain}.com`);

/**
 * Generates valid user roles
 */
export const roleArbitrary = fc.constantFrom("BUYER", "ORGANIZER", "ADMIN");

/**
 * Generates valid JWT payloads
 */
export const jwtPayloadArbitrary = fc
  .tuple(userIdArbitrary, emailArbitrary, roleArbitrary)
  .map(([userId, email, role]) => ({
    sub: userId,
    email,
    role,
  }));

/**
 * Generates timestamps (in seconds, as JWT uses)
 */
export const timestampArbitrary = fc.integer({
  min: 1000000000,
  max: 2000000000,
});

/**
 * Generates JWT payloads with iat and exp claims
 */
export const jwtPayloadWithTimestampsArbitrary = fc
  .tuple(jwtPayloadArbitrary, timestampArbitrary)
  .map(([payload, iat]) => ({
    ...payload,
    iat,
    exp: iat + 900, // 15 minutes expiration
  }));

/**
 * Generates expired JWT payloads (exp in the past)
 */
export const expiredJwtPayloadArbitrary = fc
  .tuple(jwtPayloadArbitrary, timestampArbitrary)
  .map(([payload, iat]) => ({
    ...payload,
    iat,
    exp: iat - 100, // Already expired
  }));

/**
 * Generates valid JWT tokens (as strings)
 * Note: These are not cryptographically signed, just base64 encoded
 */
export const jwtTokenArbitrary = jwtPayloadWithTimestampsArbitrary.map(
  (payload) => {
    const header = Buffer.from(
      JSON.stringify({ alg: "HS256", typ: "JWT" }),
    ).toString("base64");
    const body = Buffer.from(JSON.stringify(payload)).toString("base64");
    const signature = "mock_signature";
    return `${header}.${body}.${signature}`;
  },
);

/**
 * Generates invalid JWT tokens (malformed)
 */
export const invalidJwtTokenArbitrary = fc.oneof(
  fc.stringMatching(/^[a-zA-Z0-9]{10,}$/),
  fc
    .tuple(
      fc.stringMatching(/^[a-zA-Z0-9]{5,}$/),
      fc.stringMatching(/^[a-zA-Z0-9]{5,}$/),
    )
    .map(([a, b]) => `${a}.${b}`),
  fc.constant("not.a.valid.token.with.too.many.parts"),
  fc.constant(""),
  fc.constant("."),
);

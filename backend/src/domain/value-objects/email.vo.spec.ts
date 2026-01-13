import { Email } from "./email.vo";
import { InvalidEmailException } from "../exceptions/invalid-email.exception";

describe("Email Value Object", () => {
  describe("create", () => {
    it("should create Email with valid format", () => {
      const email = Email.create("user@example.com");

      expect(email.value).toBe("user@example.com");
    });

    it("should create Email with valid format containing numbers", () => {
      const email = Email.create("user123@example.com");

      expect(email.value).toBe("user123@example.com");
    });

    it("should create Email with valid format containing dots", () => {
      const email = Email.create("user.name@example.com");

      expect(email.value).toBe("user.name@example.com");
    });

    it("should create Email with valid format containing plus", () => {
      const email = Email.create("user+tag@example.com");

      expect(email.value).toBe("user+tag@example.com");
    });

    it("should normalize email to lowercase", () => {
      const email = Email.create("USER@EXAMPLE.COM");

      expect(email.value).toBe("user@example.com");
    });

    it("should trim whitespace from email", () => {
      const email = Email.create("  user@example.com  ");

      expect(email.value).toBe("user@example.com");
    });

    it("should normalize and trim email", () => {
      const email = Email.create("  USER@EXAMPLE.COM  ");

      expect(email.value).toBe("user@example.com");
    });

    it("should throw InvalidEmailException for email without @", () => {
      expect(() => Email.create("userexample.com")).toThrow(
        InvalidEmailException,
      );
      expect(() => Email.create("userexample.com")).toThrow(
        "Invalid email format: userexample.com",
      );
    });

    it("should throw InvalidEmailException for email without domain", () => {
      expect(() => Email.create("user@")).toThrow(InvalidEmailException);
      expect(() => Email.create("user@")).toThrow(
        "Invalid email format: user@",
      );
    });

    it("should throw InvalidEmailException for email without local part", () => {
      expect(() => Email.create("@example.com")).toThrow(InvalidEmailException);
      expect(() => Email.create("@example.com")).toThrow(
        "Invalid email format: @example.com",
      );
    });

    it("should throw InvalidEmailException for empty string", () => {
      expect(() => Email.create("")).toThrow(InvalidEmailException);
      expect(() => Email.create("")).toThrow("Invalid email format: ");
    });

    it("should throw InvalidEmailException for whitespace only", () => {
      expect(() => Email.create("   ")).toThrow(InvalidEmailException);
      expect(() => Email.create("   ")).toThrow("Invalid email format:    ");
    });

    it("should throw InvalidEmailException for email with spaces", () => {
      expect(() => Email.create("user name@example.com")).toThrow(
        InvalidEmailException,
      );
      expect(() => Email.create("user name@example.com")).toThrow(
        "Invalid email format: user name@example.com",
      );
    });

    it("should throw InvalidEmailException for email without TLD", () => {
      expect(() => Email.create("user@example")).toThrow(InvalidEmailException);
      expect(() => Email.create("user@example")).toThrow(
        "Invalid email format: user@example",
      );
    });
  });

  describe("equals", () => {
    it("should return true for emails with same value", () => {
      const email1 = Email.create("user@example.com");
      const email2 = Email.create("user@example.com");

      expect(email1.equals(email2)).toBe(true);
    });

    it("should return true for emails that are equivalent after normalization (case insensitive)", () => {
      const email1 = Email.create("USER@EXAMPLE.COM");
      const email2 = Email.create("user@example.com");

      expect(email1.equals(email2)).toBe(true);
    });

    it("should return true for emails that are equivalent after trimming", () => {
      const email1 = Email.create("  user@example.com  ");
      const email2 = Email.create("user@example.com");

      expect(email1.equals(email2)).toBe(true);
    });

    it("should return true for emails that are equivalent after normalization and trimming", () => {
      const email1 = Email.create("  USER@EXAMPLE.COM  ");
      const email2 = Email.create("user@example.com");

      expect(email1.equals(email2)).toBe(true);
    });

    it("should return false for emails with different values", () => {
      const email1 = Email.create("user1@example.com");
      const email2 = Email.create("user2@example.com");

      expect(email1.equals(email2)).toBe(false);
    });

    it("should return false for emails with different domains", () => {
      const email1 = Email.create("user@example.com");
      const email2 = Email.create("user@different.com");

      expect(email1.equals(email2)).toBe(false);
    });
  });
});

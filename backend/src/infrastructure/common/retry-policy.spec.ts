import { RetryPolicy } from "./retry-policy";

/**
 * Unit tests for RetryPolicy
 * Tests the retry mechanism with exponential backoff
 * Requirements: 5.5 - Retry up to 3 times before escalating
 */
describe("RetryPolicy", () => {
  describe("execute", () => {
    it("should succeed on first attempt", async () => {
      // Arrange
      const policy = new RetryPolicy({
        maxAttempts: 3,
        initialDelayMs: 10,
        backoffMultiplier: 2,
      });
      const operation = jest.fn().mockResolvedValue("success");

      // Act
      const result = await policy.execute(operation, "TestOp");

      // Assert
      expect(result.result).toBe("success");
      expect(result.attempts).toBe(1);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it("should retry and succeed on second attempt", async () => {
      // Arrange
      const policy = new RetryPolicy({
        maxAttempts: 3,
        initialDelayMs: 10,
        backoffMultiplier: 2,
      });
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error("Fail 1"))
        .mockResolvedValueOnce("success");

      // Act
      const result = await policy.execute(operation, "TestOp");

      // Assert
      expect(result.result).toBe("success");
      expect(result.attempts).toBe(2);
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it("should retry and succeed on third attempt", async () => {
      // Arrange
      const policy = new RetryPolicy({
        maxAttempts: 3,
        initialDelayMs: 10,
        backoffMultiplier: 2,
      });
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error("Fail 1"))
        .mockRejectedValueOnce(new Error("Fail 2"))
        .mockResolvedValueOnce("success");

      // Act
      const result = await policy.execute(operation, "TestOp");

      // Assert
      expect(result.result).toBe("success");
      expect(result.attempts).toBe(3);
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it("should throw error after max attempts exceeded", async () => {
      // Arrange
      const policy = new RetryPolicy({
        maxAttempts: 3,
        initialDelayMs: 10,
        backoffMultiplier: 2,
      });
      const operation = jest.fn().mockRejectedValue(new Error("Always fails"));

      // Act & Assert
      await expect(policy.execute(operation, "TestOp")).rejects.toThrow(
        "TestOp failed after 3 attempts",
      );
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it("should handle non-Error exceptions", async () => {
      // Arrange
      const policy = new RetryPolicy({
        maxAttempts: 2,
        initialDelayMs: 10,
        backoffMultiplier: 2,
      });
      const operation = jest.fn().mockRejectedValue("string error");

      // Act & Assert
      await expect(policy.execute(operation, "TestOp")).rejects.toThrow(
        "TestOp failed after 2 attempts",
      );
    });
  });

  describe("executeWithFallback", () => {
    it("should succeed on first attempt", async () => {
      // Arrange
      const policy = new RetryPolicy({
        maxAttempts: 3,
        initialDelayMs: 10,
        backoffMultiplier: 2,
      });
      const operation = jest.fn().mockResolvedValue("success");

      // Act
      const result = await policy.executeWithFallback(operation, "TestOp");

      // Assert
      expect(result.result).toBe("success");
      expect(result.attempts).toBe(1);
      expect(result.error).toBeUndefined();
    });

    it("should return null result after max attempts", async () => {
      // Arrange
      const policy = new RetryPolicy({
        maxAttempts: 2,
        initialDelayMs: 10,
        backoffMultiplier: 2,
      });
      const operation = jest.fn().mockRejectedValue(new Error("Always fails"));

      // Act
      const result = await policy.executeWithFallback(operation, "TestOp");

      // Assert
      expect(result.result).toBeNull();
      expect(result.attempts).toBe(2);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain("Always fails");
    });

    it("should retry and succeed on second attempt", async () => {
      // Arrange
      const policy = new RetryPolicy({
        maxAttempts: 3,
        initialDelayMs: 10,
        backoffMultiplier: 2,
      });
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error("Fail 1"))
        .mockResolvedValueOnce("success");

      // Act
      const result = await policy.executeWithFallback(operation, "TestOp");

      // Assert
      expect(result.result).toBe("success");
      expect(result.attempts).toBe(2);
      expect(result.error).toBeUndefined();
    });
  });

  describe("default configuration", () => {
    it("should use default config when none provided", async () => {
      // Arrange
      const policy = new RetryPolicy();
      const operation = jest.fn().mockResolvedValue("success");

      // Act
      const result = await policy.execute(operation);

      // Assert
      expect(result.result).toBe("success");
      expect(result.attempts).toBe(1);
    });
  });

  describe("exponential backoff", () => {
    it("should apply exponential backoff between retries", async () => {
      // Arrange
      const policy = new RetryPolicy({
        maxAttempts: 3,
        initialDelayMs: 10,
        backoffMultiplier: 2,
      });
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error("Fail 1"))
        .mockRejectedValueOnce(new Error("Fail 2"))
        .mockResolvedValueOnce("success");

      const startTime = Date.now();

      // Act
      const result = await policy.execute(operation, "TestOp");

      const elapsedTime = Date.now() - startTime;

      // Assert
      expect(result.result).toBe("success");
      expect(result.attempts).toBe(3);
      // Should have delayed at least 30ms (10ms + 20ms)
      expect(elapsedTime).toBeGreaterThanOrEqual(30);
    });

    it("should not delay after final failed attempt", async () => {
      // Arrange
      const policy = new RetryPolicy({
        maxAttempts: 2,
        initialDelayMs: 50,
        backoffMultiplier: 2,
      });
      const operation = jest.fn().mockRejectedValue(new Error("Always fails"));

      const startTime = Date.now();

      // Act & Assert
      try {
        await policy.execute(operation, "TestOp");
      } catch {
        // Expected to throw
      }

      const elapsedTime = Date.now() - startTime;

      // Should have delayed only once (50ms), not twice
      expect(elapsedTime).toBeLessThan(150);
    });
  });

  describe("error handling", () => {
    it("should preserve error message from last attempt", async () => {
      // Arrange
      const policy = new RetryPolicy({
        maxAttempts: 2,
        initialDelayMs: 10,
        backoffMultiplier: 2,
      });
      const operation = jest
        .fn()
        .mockRejectedValue(new Error("Specific error message"));

      // Act & Assert
      await expect(policy.execute(operation, "MyOp")).rejects.toThrow(
        "Specific error message",
      );
    });

    it("should handle non-Error objects in executeWithFallback", async () => {
      // Arrange
      const policy = new RetryPolicy({
        maxAttempts: 1,
        initialDelayMs: 10,
        backoffMultiplier: 2,
      });
      const operation = jest.fn().mockRejectedValue("string error");

      // Act
      const result = await policy.executeWithFallback(operation, "TestOp");

      // Assert
      expect(result.result).toBeNull();
      expect(result.error).toBeDefined();
    });
  });
});

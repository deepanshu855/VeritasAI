import { describe, test, expect } from "@jest/globals";

describe("setup check", () => {
  test("Jest runs with ES modules", () => {
    expect(1 + 1).toBe(2);
  });
});
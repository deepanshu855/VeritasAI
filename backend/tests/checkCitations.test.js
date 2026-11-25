import { describe, test, expect, jest } from "@jest/globals";

// Stunt doubles: stop rag-sources.service.js from loading the real database model and search.
jest.unstable_mockModule("../src/models/file.model.js", () => ({
  default: {},
}));
jest.unstable_mockModule("../src/services/hybrid-retrieval.service.js", () => ({
  retrieveHybrid: jest.fn(),
}));

// Import AFTER the mocks are set up (static imports would run first and skip the mocks).
const { checkCitations } = await import("../src/services/rag-sources.service.js");

describe("checkCitations", () => {
  test("keeps plain valid citations unchanged", () => {
    expect(
      checkCitations("Indexes speed up search [1]. A key is unique [2].", 5),
    ).toEqual({
      cleaned: "Indexes speed up search [1]. A key is unique [2].",
      used: [1, 2],
      invalid: 0,
      reformatted: 0,
    });
  });

  test("rewrites the 【1】 and 【1†L1-L4】 styles as plain [n] (lesson 2)", () => {
    expect(checkCitations("First 【1】 and second 【2†L1-L4】.", 5)).toEqual({
      cleaned: "First [1] and second [2].",
      used: [1, 2],
      invalid: 0,
      reformatted: 2,
    });
  });

  test("splits a list like [1, 2] into [1][2]", () => {
    expect(checkCitations("Both apply [1, 2].", 5)).toEqual({
      cleaned: "Both apply [1][2].",
      used: [1, 2],
      invalid: 0,
      reformatted: 1,
    });
  });

  test("removes a citation number that is not a real source", () => {
    expect(checkCitations("Claim [9].", 5)).toEqual({
      cleaned: "Claim .",
      used: [],
      invalid: 1,
      reformatted: 0,
    });
  });

  test("keeps the valid number and drops the invalid one in the same bracket", () => {
    expect(checkCitations("Mixed [2, 7].", 5)).toEqual({
      cleaned: "Mixed [2].",
      used: [2],
      invalid: 1,
      reformatted: 1,
    });
  });

  test("leaves text without number brackets untouched", () => {
    expect(checkCitations("See [note] for details.", 5)).toEqual({
      cleaned: "See [note] for details.",
      used: [],
      invalid: 0,
      reformatted: 0,
    });
  });

  test("lists each used source once, sorted", () => {
    expect(checkCitations("B [3]. A [1]. Again [3].", 5)).toEqual({
      cleaned: "B [3]. A [1]. Again [3].",
      used: [1, 3],
      invalid: 0,
      reformatted: 0,
    });
  });
});
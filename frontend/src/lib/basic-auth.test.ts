import { describe, expect, it } from "vitest";

import {
  BASIC_AUTH_CHALLENGE_HEADER,
  parseBasicAuthHeader,
  timingSafeEqualString,
  verifyBasicAuth,
} from "./basic-auth";

function basic(user: string, pass: string): string {
  return `Basic ${Buffer.from(`${user}:${pass}`, "utf8").toString("base64")}`;
}

describe("parseBasicAuthHeader", () => {
  it("parses a well-formed header", () => {
    expect(parseBasicAuthHeader(basic("alice", "s3cr3t"))).toEqual({
      user: "alice",
      pass: "s3cr3t",
    });
  });

  it("supports UTF-8 credentials (passwords with non-ASCII)", () => {
    expect(parseBasicAuthHeader(basic("José", "pässwörd"))).toEqual({
      user: "José",
      pass: "pässwörd",
    });
  });

  it("is case-insensitive on the scheme keyword", () => {
    expect(parseBasicAuthHeader(`basic ${Buffer.from("a:b").toString("base64")}`))
      .toEqual({ user: "a", pass: "b" });
    expect(parseBasicAuthHeader(`BASIC ${Buffer.from("a:b").toString("base64")}`))
      .toEqual({ user: "a", pass: "b" });
  });

  it("handles empty password", () => {
    expect(parseBasicAuthHeader(basic("user", ""))).toEqual({
      user: "user",
      pass: "",
    });
  });

  it("preserves colons inside the password", () => {
    expect(parseBasicAuthHeader(basic("user", "a:b:c"))).toEqual({
      user: "user",
      pass: "a:b:c",
    });
  });

  it("returns null for missing / malformed input", () => {
    expect(parseBasicAuthHeader(null)).toBeNull();
    expect(parseBasicAuthHeader(undefined)).toBeNull();
    expect(parseBasicAuthHeader("")).toBeNull();
    expect(parseBasicAuthHeader("Bearer token")).toBeNull();
    expect(parseBasicAuthHeader("Basic")).toBeNull();
    expect(parseBasicAuthHeader("Basic !!!not-base64!!!")).toBeNull();
    const noColon = `Basic ${Buffer.from("no-colon-here").toString("base64")}`;
    expect(parseBasicAuthHeader(noColon)).toBeNull();
  });
});

describe("timingSafeEqualString", () => {
  it("returns true for identical strings", () => {
    expect(timingSafeEqualString("abcdef", "abcdef")).toBe(true);
    expect(timingSafeEqualString("", "")).toBe(true);
  });

  it("returns false for different strings of the same length", () => {
    expect(timingSafeEqualString("abcdef", "abcdeg")).toBe(false);
  });

  it("returns false for different lengths", () => {
    expect(timingSafeEqualString("a", "abc")).toBe(false);
    expect(timingSafeEqualString("abc", "")).toBe(false);
  });
});

describe("verifyBasicAuth", () => {
  const expected = { user: "operator", pass: "correct horse battery staple" };

  it("accepts correct credentials", () => {
    expect(verifyBasicAuth(basic(expected.user, expected.pass), expected)).toBe(
      true,
    );
  });

  it("rejects wrong username", () => {
    expect(verifyBasicAuth(basic("other", expected.pass), expected)).toBe(false);
  });

  it("rejects wrong password", () => {
    expect(verifyBasicAuth(basic(expected.user, "nope"), expected)).toBe(false);
  });

  it("rejects missing header", () => {
    expect(verifyBasicAuth(null, expected)).toBe(false);
    expect(verifyBasicAuth(undefined, expected)).toBe(false);
  });

  it("rejects malformed header", () => {
    expect(verifyBasicAuth("not-basic", expected)).toBe(false);
    expect(verifyBasicAuth("Basic ???", expected)).toBe(false);
  });
});

describe("BASIC_AUTH_CHALLENGE_HEADER", () => {
  it("advertises the expected realm", () => {
    expect(BASIC_AUTH_CHALLENGE_HEADER).toContain('realm="Mentemaestra CRM"');
    expect(BASIC_AUTH_CHALLENGE_HEADER.startsWith("Basic ")).toBe(true);
  });
});

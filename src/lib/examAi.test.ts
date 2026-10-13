import { describe, it, expect } from "vitest";
import { nextInterval } from "./examAi";

describe("nextInterval", () => {
  it("resets when forgotten", () => expect(nextInterval(10, false)).toBe(0));
  it("new card known -> 1 day", () => expect(nextInterval(0, true)).toBe(1));
  it("grows 2.5x", () => expect(nextInterval(4, true)).toBe(10));
  it("caps at 60", () => expect(nextInterval(40, true)).toBe(60));
});

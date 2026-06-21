import { describe, expect, it } from "vitest";
import { toApiList } from "@/hooks/useDashboardQueries";

// Guards the list-page bug class: an endpoint returning a non-array shape used
// to crash `.map()` and white-screen the page (scores, announcements).
describe("toApiList", () => {
  it("passes a real array through unchanged", () => {
    expect(toApiList([1, 2, 3])).toEqual([1, 2, 3]);
    expect(toApiList([])).toEqual([]);
  });

  it("unwraps a { items: [...] } envelope", () => {
    expect(toApiList({ items: [{ id: "a" }] })).toEqual([{ id: "a" }]);
  });

  it("unwraps a { data: [...] } envelope", () => {
    expect(toApiList({ data: [1, 2] })).toEqual([1, 2]);
  });

  it("returns [] for an aggregate object (the scores.map bug)", () => {
    expect(toApiList({ total: 0, avgScore: 100 })).toEqual([]);
  });

  it("returns [] for null/undefined/primitives", () => {
    expect(toApiList(null)).toEqual([]);
    expect(toApiList(undefined)).toEqual([]);
    expect(toApiList("oops")).toEqual([]);
    expect(toApiList(42)).toEqual([]);
  });
});

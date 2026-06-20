import { describe, expect, it } from "vitest";
import {
  classifyExceptionValidity,
  validityLabel,
} from "@/lib/attendance/exception-validity";

describe("classifyExceptionValidity", () => {
  it("marks a clean check-in (selfie, accurate GPS, inside radius) as VALID", () => {
    const r = classifyExceptionValidity({
      type: "BAD_GPS_ACCURACY",
      hasSelfie: true,
      accuracyMeters: 40,
      distanceMeters: 30,
      geoStatus: "INSIDE",
    });
    expect(r.tier).toBe("VALID");
    expect(r.score).toBeGreaterThanOrEqual(80);
  });

  it("rejects a missing-selfie exception as INVALID", () => {
    const r = classifyExceptionValidity({ type: "MISSING_SELFIE", hasSelfie: false });
    expect(r.tier).toBe("INVALID");
    expect(r.reasons.join(" ")).toMatch(/selfie/i);
  });

  it("rejects a check-in far outside the work radius as INVALID", () => {
    const r = classifyExceptionValidity({
      type: "OUTSIDE_GEOFENCE",
      hasSelfie: true,
      accuracyMeters: 20,
      distanceMeters: 3131,
      geoStatus: "OUTSIDE",
    });
    expect(r.tier).toBe("INVALID");
  });

  it("flags a borderline GPS-accuracy case as REVIEW", () => {
    const r = classifyExceptionValidity({
      type: "BAD_GPS_ACCURACY",
      hasSelfie: true,
      accuracyMeters: 150,
      distanceMeters: 60,
      geoStatus: "INSIDE",
    });
    expect(r.tier).toBe("REVIEW");
  });

  it("flags slightly-outside radius as REVIEW, not INVALID", () => {
    const r = classifyExceptionValidity({
      type: "OUTSIDE_GEOFENCE",
      hasSelfie: true,
      accuracyMeters: 30,
      distanceMeters: 220,
      geoStatus: "OUTSIDE",
    });
    expect(r.tier).toBe("REVIEW");
  });

  it("keeps a metric-less manual exception in REVIEW (cannot auto-judge)", () => {
    const r = classifyExceptionValidity({
      type: "MANUAL_ADJUSTMENT",
      hasSelfie: true,
      accuracyMeters: null,
      distanceMeters: null,
      geoStatus: null,
    });
    expect(r.tier).toBe("REVIEW");
  });

  it("never returns a score outside 0–100", () => {
    const worst = classifyExceptionValidity({
      type: "MISSING_SELFIE",
      hasSelfie: false,
      accuracyMeters: 9999,
      distanceMeters: 99999,
      geoStatus: "OUTSIDE",
    });
    expect(worst.score).toBeGreaterThanOrEqual(0);
    expect(worst.score).toBeLessThanOrEqual(100);
  });

  it("exposes Indonesian tier labels", () => {
    expect(validityLabel("VALID")).toBe("Valid");
    expect(validityLabel("REVIEW")).toBe("Perlu Ditinjau");
    expect(validityLabel("INVALID")).toBe("Tidak Valid");
  });
});

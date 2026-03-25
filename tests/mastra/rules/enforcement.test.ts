import { describe, it, expect } from "vitest";
import {
  shouldTriggerCourseCorrection, shouldForceExperiment,
  canShadowVerticalTriggerDecision, hasMetDecisionThreshold,
} from "../../../src/mastra/rules/enforcement";

describe("Enforcement Rules", () => {
  describe("shouldTriggerCourseCorrection", () => {
    it("returns true when activity up but results flat for 3+ days", () => {
      expect(shouldTriggerCourseCorrection({ activityToday: 50, resultToday: 2, activity7DayAvg: 30, result7DayAvg: 3, flatDays: 3 })).toBe(true);
    });
    it("returns false when results are improving", () => {
      expect(shouldTriggerCourseCorrection({ activityToday: 50, resultToday: 10, activity7DayAvg: 30, result7DayAvg: 3, flatDays: 3 })).toBe(false);
    });
    it("returns false when flat less than 3 days", () => {
      expect(shouldTriggerCourseCorrection({ activityToday: 50, resultToday: 2, activity7DayAvg: 30, result7DayAvg: 3, flatDays: 2 })).toBe(false);
    });
    it("returns false when activity not up", () => {
      expect(shouldTriggerCourseCorrection({ activityToday: 20, resultToday: 2, activity7DayAvg: 30, result7DayAvg: 3, flatDays: 5 })).toBe(false);
    });
  });

  describe("shouldForceExperiment", () => {
    it("returns true when below target, no experiments, flat 3+ days", () => {
      expect(shouldForceExperiment({ conversionRate: 0.02, targetConversionRate: 0.05, activeExperiments: 0, flatDays: 3 })).toBe(true);
    });
    it("returns false when experiment already running", () => {
      expect(shouldForceExperiment({ conversionRate: 0.02, targetConversionRate: 0.05, activeExperiments: 1, flatDays: 5 })).toBe(false);
    });
    it("returns false when conversion at target", () => {
      expect(shouldForceExperiment({ conversionRate: 0.06, targetConversionRate: 0.05, activeExperiments: 0, flatDays: 5 })).toBe(false);
    });
  });

  describe("canShadowVerticalTriggerDecision", () => {
    it("always allows primary vertical", () => {
      expect(canShadowVerticalTriggerDecision({ isPrimary: true, sampleSize: 0, promotionThreshold: 1000, ceoApproved: false })).toBe(true);
    });
    it("blocks shadow without sufficient sample", () => {
      expect(canShadowVerticalTriggerDecision({ isPrimary: false, sampleSize: 50, promotionThreshold: 100, ceoApproved: true })).toBe(false);
    });
    it("blocks shadow without CEO approval", () => {
      expect(canShadowVerticalTriggerDecision({ isPrimary: false, sampleSize: 200, promotionThreshold: 100, ceoApproved: false })).toBe(false);
    });
    it("allows shadow with sufficient sample AND CEO approval", () => {
      expect(canShadowVerticalTriggerDecision({ isPrimary: false, sampleSize: 200, promotionThreshold: 100, ceoApproved: true })).toBe(true);
    });
  });

  describe("hasMetDecisionThreshold", () => {
    it("returns true when all thresholds met", () => {
      expect(hasMetDecisionThreshold({ minSampleSize: 100, actualSampleSize: 150, minSendCount: 50, actualSendCount: 75, minSpend: 200, actualSpend: 300 })).toBe(true);
    });
    it("returns false when sample not met", () => {
      expect(hasMetDecisionThreshold({ minSampleSize: 1000, actualSampleSize: 50, minSendCount: null, actualSendCount: 0, minSpend: null, actualSpend: 0 })).toBe(false);
    });
    it("returns true when no minimums set", () => {
      expect(hasMetDecisionThreshold({ minSampleSize: null, actualSampleSize: 5, minSendCount: null, actualSendCount: 3, minSpend: null, actualSpend: 0 })).toBe(true);
    });
  });
});

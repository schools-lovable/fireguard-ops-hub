import { describe, expect, it } from "vitest";
import { calculateProgress, gradeQuiz } from "./academyRules";

describe("Academy grading and progress", () => {
  it("auto-grades deterministic quiz answers against the eighty-percent threshold", () => {
    expect(gradeQuiz([{ id: 1, correctOption: 0 }, { id: 2, correctOption: 2 }, { id: 3, correctOption: 1 }, { id: 4, correctOption: 0 }, { id: 5, correctOption: 1 }], { 1: 0, 2: 2, 3: 1, 4: 0, 5: 3 })).toMatchObject({ correctCount: 4, scorePercent: 80, isPassed: true });
  });

  it("sets course status from completed lesson counts", () => {
    expect(calculateProgress(0, 4)).toEqual({ progressPercent: 0, status: "not_started" });
    expect(calculateProgress(2, 4)).toEqual({ progressPercent: 50, status: "in_progress" });
    expect(calculateProgress(4, 4)).toEqual({ progressPercent: 100, status: "complete" });
  });
});

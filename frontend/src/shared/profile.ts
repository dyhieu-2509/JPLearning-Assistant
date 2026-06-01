import type { StudentProfileResponse } from "./models";

export function needsLearnerOnboarding(profile: StudentProfileResponse): boolean {
  const defaultGoal = !profile.goal || profile.goal === "JLPT preparation";
  const defaultPath = (profile.currentLevel ?? "N5") === "N5" && (profile.targetLevel ?? "N4") === "N4";
  return defaultGoal && defaultPath && profile.weakSkills.length === 0;
}

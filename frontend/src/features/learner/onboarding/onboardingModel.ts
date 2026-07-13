import type { StudentProfileRequest } from "../../../shared/models";
import { learningPathwayLabel } from "../../../shared/pathways";

export type OnboardingAnswers = {
  currentLevel: string;
  targetLevel: string;
  learningPathway: string;
  deadline: string;
  dailyStudyMinutes: string;
  weakSkills: string[];
  explanationStyle: string;
  romajiEnabled: string;
};

export const initialOnboardingAnswers: OnboardingAnswers = {
  currentLevel: "N5",
  targetLevel: "N4",
  learningPathway: "jlpt_foundation",
  deadline: "trong 3 tháng",
  dailyStudyMinutes: "30",
  weakSkills: ["vocabulary"],
  explanationStyle: "step-by-step",
  romajiEnabled: "true"
};

export function toProfileRequest(answers: OnboardingAnswers): StudentProfileRequest {
  return {
    currentLevel: answers.currentLevel,
    targetLevel: answers.targetLevel,
    goal: `${learningPathwayLabel(answers.learningPathway)} ${answers.targetLevel} ${answers.deadline}`,
    learningPathway: answers.learningPathway,
    dailyStudyMinutes: Number(answers.dailyStudyMinutes),
    explanationStyle: answers.explanationStyle,
    romajiEnabled: answers.romajiEnabled === "true",
    weakSkills: answers.weakSkills
  };
}

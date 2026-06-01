import type { StudentProfileRequest } from "../../../shared/models";

export type OnboardingAnswers = {
  currentLevel: string;
  targetLevel: string;
  goal: string;
  deadline: string;
  dailyStudyMinutes: string;
  weakSkills: string[];
  explanationStyle: string;
  romajiEnabled: string;
};

export const initialOnboardingAnswers: OnboardingAnswers = {
  currentLevel: "N5",
  targetLevel: "N4",
  goal: "Pass JLPT",
  deadline: "in 3 months",
  dailyStudyMinutes: "30",
  weakSkills: ["vocabulary"],
  explanationStyle: "step-by-step",
  romajiEnabled: "true"
};

export function toProfileRequest(answers: OnboardingAnswers): StudentProfileRequest {
  return {
    currentLevel: answers.currentLevel,
    targetLevel: answers.targetLevel,
    goal: `${answers.goal} ${answers.targetLevel} ${answers.deadline}`,
    dailyStudyMinutes: Number(answers.dailyStudyMinutes),
    explanationStyle: answers.explanationStyle,
    romajiEnabled: answers.romajiEnabled === "true",
    weakSkills: answers.weakSkills
  };
}

import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { ChoiceCard, IconTextButton, Panel, PrimaryButton, ProgressMeter, TopicChip } from "../../../shared/components";
import type { StudentProfileRequest } from "../../../shared/models";
import { initialOnboardingAnswers, toProfileRequest, type OnboardingAnswers } from "./onboardingModel";
import { onboardingQuestions, type OnboardingField } from "./onboardingConfig";

type OnboardingWizardProps = {
  eyebrow: string;
  title: string;
  description: string;
  completeLabel: string;
  onComplete: (request: StudentProfileRequest) => Promise<void>;
};

export function OnboardingWizard({
  eyebrow,
  title,
  description,
  completeLabel,
  onComplete
}: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<OnboardingAnswers>(initialOnboardingAnswers);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const question = onboardingQuestions[step];
  const Icon = question.icon;
  const lastStep = step === onboardingQuestions.length - 1;
  const selectedWeakSkills = useMemo(() => {
    const labels = question.id === "weakSkills" ? question.options : onboardingQuestions[5].options;
    return answers.weakSkills.map((skill) => labels.find((option) => option.value === skill)?.label ?? skill);
  }, [answers.weakSkills, question.id, question.options]);

  function selectAnswer(field: OnboardingField, value: string) {
    if (field === "weakSkills") {
      setAnswers((current) => {
        const exists = current.weakSkills.includes(value);
        const weakSkills = exists
          ? current.weakSkills.filter((item) => item !== value)
          : [...current.weakSkills, value];
        return { ...current, weakSkills: weakSkills.length ? weakSkills : [value] };
      });
      return;
    }

    setAnswers((current) => ({ ...current, [field]: value }));
  }

  async function finish() {
    setSaving(true);
    setError(null);
    try {
      await onComplete(toProfileRequest(answers));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Cannot save onboarding profile");
    } finally {
      setSaving(false);
    }
  }

  function next() {
    if (lastStep) {
      void finish();
      return;
    }
    setStep((current) => current + 1);
  }

  return (
    <main className="onboarding-shell">
      <section className="onboarding-hero">
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p>{description}</p>
        <div className="chip-row">
          {selectedWeakSkills.map((skill) => (
            <TopicChip key={skill}>{skill}</TopicChip>
          ))}
        </div>
      </section>

      <Panel className="onboarding-panel">
        <ProgressMeter current={step + 1} total={onboardingQuestions.length} />
        <div className="onboarding-question">
          <div className="onboarding-icon">
            <Icon size={26} />
          </div>
          <div>
            <p className="eyebrow">{question.eyebrow}</p>
            <h3>{question.title}</h3>
            <p className="muted-copy">{question.subtitle}</p>
          </div>
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="choice-grid">
          {question.options.map((option) => (
            <ChoiceCard
              key={option.value}
              label={option.label}
              description={option.description}
              selected={isSelected(answers, question.id, option.value)}
              onClick={() => selectAnswer(question.id, option.value)}
              icon={isSelected(answers, question.id, option.value) ? <Check size={18} /> : undefined}
            />
          ))}
        </div>

        <div className="onboarding-actions">
          <IconTextButton
            type="button"
            variant="ghost"
            disabled={step === 0 || saving}
            onClick={() => setStep((current) => Math.max(0, current - 1))}
          >
            <ArrowLeft size={18} />
            Back
          </IconTextButton>
          <PrimaryButton type="button" disabled={saving} onClick={next}>
            {saving ? <Loader2 className="spin" size={18} /> : <ArrowRight size={18} />}
            {lastStep ? completeLabel : "Next"}
          </PrimaryButton>
        </div>
      </Panel>
    </main>
  );
}

function isSelected(answers: OnboardingAnswers, field: OnboardingField, value: string): boolean {
  if (field === "weakSkills") {
    return answers.weakSkills.includes(value);
  }
  return answers[field] === value;
}

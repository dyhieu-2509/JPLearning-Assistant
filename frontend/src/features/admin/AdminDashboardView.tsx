import { Activity, BookOpenCheck, Bot, DatabaseZap, ShieldCheck, UsersRound } from "lucide-react";
import { EmptyState, MetricTile, PageHeader, Panel, TopicChip } from "../../shared/components";

const adminFocusAreas = [
  "Learner profile quality",
  "Knowledge graph coverage",
  "Tutor answer confidence",
  "JLPT content readiness",
  "Assessment calibration"
];

const adminWorkstreams = [
  {
    title: "Learner Management",
    description: "View student cohorts, onboarding answers, progress signals, weak skills, and retention risk."
  },
  {
    title: "Knowledge Operations",
    description: "Review vocabulary, grammar, kanji nodes, relationship coverage, and vector indexing status."
  },
  {
    title: "Tutor Quality",
    description: "Inspect low-confidence chatbot answers, missing citations, repeated mistakes, and escalation cases."
  },
  {
    title: "Content Governance",
    description: "Prepare JLPT decks, assessment banks, study-plan templates, and release-ready MVP content."
  }
];

export function AdminDashboardView() {
  return (
    <main className="page-section">
      <PageHeader eyebrow="Admin portal" title="Operations dashboard" />

      <div className="dashboard-grid">
        <MetricTile icon={<UsersRound size={22} />} label="Learner accounts" value="-" accent="sky" />
        <MetricTile icon={<DatabaseZap size={22} />} label="Knowledge items" value="-" accent="green" />
        <MetricTile icon={<Bot size={22} />} label="Tutor sessions" value="-" accent="amber" />
        <MetricTile icon={<Activity size={22} />} label="Review queue" value="-" accent="rose" />
      </div>

      <Panel className="admin-overview-panel" title="Admin boundary" eyebrow="MVP structure">
        <div className="admin-boundary">
          <ShieldCheck size={36} />
          <div>
            <strong>Admin and learner experiences are now separated.</strong>
            <p className="muted-copy">
              Learners use `/learner` for tutoring, flashcards, assessment, and planning. Admin users use `/admin`
              for operations, content governance, learner monitoring, and system quality control.
            </p>
          </div>
        </div>
      </Panel>

      <Panel title="Admin workstreams" eyebrow="Product surface">
        <div className="admin-workstream-grid">
          {adminWorkstreams.map((item) => (
            <article className="admin-workstream" key={item.title}>
              <BookOpenCheck size={20} />
              <strong>{item.title}</strong>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </Panel>

      <Panel title="Personalization quality signals" eyebrow="What admin should monitor">
        <div className="chip-row">
          {adminFocusAreas.map((area) => (
            <TopicChip key={area}>{area}</TopicChip>
          ))}
        </div>
      </Panel>

      <EmptyState compact>
        Admin APIs are not wired yet. The next backend task should expose learner analytics, content management, and
        tutor quality review endpoints behind an admin role.
      </EmptyState>
    </main>
  );
}

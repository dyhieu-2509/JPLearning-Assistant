import { ReactNode } from "react";
import { logoUrl } from "./assets";

export function Headbar() {
  return (
    <header className="headbar">
      <a className="headbar-brand" href="/" aria-label="VAJA home">
        <img src={logoUrl} alt="VAJA logo" />
        <span>VAJA</span>
      </a>
      <nav className="headbar-nav" aria-label="Global navigation">
        <a href="/#about">About</a>
      </nav>
    </header>
  );
}

export function PageHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="section-heading full-span">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
    </div>
  );
}

export function Panel({
  children,
  className = "",
  title,
  eyebrow,
  action
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  eyebrow?: string;
  action?: ReactNode;
}) {
  return (
    <section className={`workspace-panel ${className}`.trim()}>
      {(title || eyebrow || action) && (
        <div className="panel-heading">
          <div>
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            {title && <h3>{title}</h3>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function EmptyState({ children, compact = false }: { children: ReactNode; compact?: boolean }) {
  return <div className={`empty-state ${compact ? "compact" : ""}`.trim()}>{children}</div>;
}

export function LoadingPanel({ children }: { children: ReactNode }) {
  return <div className="loading-panel">{children}</div>;
}

export function ProgressMeter({ current, total }: { current: number; total: number }) {
  const percentage = total <= 0 ? 0 : Math.round((current / total) * 100);

  return (
    <div className="progress-meter" aria-label={`Step ${current} of ${total}`}>
      <div>
        <span>{current}</span>
        <small>/ {total}</small>
      </div>
      <progress max={100} value={percentage} />
    </div>
  );
}

export function PrimaryButton({
  children,
  disabled = false,
  type = "button",
  onClick,
  className = ""
}: {
  children: ReactNode;
  disabled?: boolean;
  type?: "button" | "submit";
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button className={`primary-button ${className}`.trim()} type={type} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}

export function IconTextButton({
  children,
  disabled = false,
  type = "button",
  onClick,
  variant = "solid",
  className = ""
}: {
  children: ReactNode;
  disabled?: boolean;
  type?: "button" | "submit";
  onClick?: () => void;
  variant?: "solid" | "ghost";
  className?: string;
}) {
  return (
    <button
      className={`icon-text-button ${variant === "ghost" ? "ghost" : ""} ${className}`.trim()}
      type={type}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function IconButton({
  children,
  disabled = false,
  title,
  type = "button",
  onClick,
  className = ""
}: {
  children: ReactNode;
  disabled?: boolean;
  title?: string;
  type?: "button" | "submit";
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button className={`icon-button ${className}`.trim()} type={type} disabled={disabled} title={title} onClick={onClick}>
      {children}
    </button>
  );
}

export function MetricTile({
  icon,
  label,
  value,
  accent
}: {
  icon: ReactNode;
  label: string;
  value: string;
  accent: "sky" | "green" | "amber" | "rose";
}) {
  return (
    <div className={`metric-tile ${accent}`}>
      <span>{icon}</span>
      <div>
        <strong>{value}</strong>
        <small>{label}</small>
      </div>
    </div>
  );
}

export function TopicChip({ children }: { children: ReactNode }) {
  return <span className="topic-chip">{children}</span>;
}

export function InfoCard({
  icon,
  title,
  description
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <article className="info-card">
      <span>{icon}</span>
      <strong>{title}</strong>
      <p>{description}</p>
    </article>
  );
}

export function ChoiceCard({
  label,
  description,
  selected,
  onClick,
  icon
}: {
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
  icon?: ReactNode;
}) {
  return (
    <button className={`choice-card ${selected ? "selected" : ""}`.trim()} type="button" onClick={onClick}>
      {icon && <span className="choice-card-icon">{icon}</span>}
      <span>
        <strong>{label}</strong>
        {description && <small>{description}</small>}
      </span>
    </button>
  );
}

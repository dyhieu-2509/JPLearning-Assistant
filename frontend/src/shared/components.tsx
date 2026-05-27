import { ReactNode } from "react";

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

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <section className="page-section">
      <div className="section-heading">
        <p className="eyebrow">MVP workspace</p>
        <h2>{title}</h2>
      </div>
      <div className="empty-state">This workflow will be wired in the next frontend task.</div>
    </section>
  );
}

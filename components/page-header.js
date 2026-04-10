export function PageHeader({ eyebrow, title, note }) {
  return (
    <section className="pageHeader">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
      </div>
      {note ? <span className="inlineNote">{note}</span> : null}
    </section>
  );
}

export default function Loading() {
  return (
    <section className="loading-state" aria-live="polite" aria-busy="true">
      <span className="loading-spinner" aria-hidden="true" />
      <p>Reseptlər yüklənir...</p>
    </section>
  )
}

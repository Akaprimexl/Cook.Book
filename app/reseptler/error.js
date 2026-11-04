'use client'

export default function ReseptXetasi({ reset }) {
  return (
    <section className="empty-state error-state" role="alert">
      <p className="eyebrow">Xəta baş verdi</p>
      <h1>Məlumatı yükləmək alınmadı</h1>
      <p>İnternet bağlantısını yoxlayın və yenidən cəhd edin.</p>
      <button className="button" type="button" onClick={() => reset()}>Yenidən cəhd et</button>
    </section>
  )
}

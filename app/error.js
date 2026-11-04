'use client'

export default function Xeta({ reset }) {
  return (
    <section className="empty-state error-state" role="alert">
      <p className="eyebrow">Xəta baş verdi</p>
      <h1>Məlumatı yükləmək alınmadı</h1>
      <p>İnternet bağlantısını yoxlayın və səhifəni yenidən yükləyin.</p>
      <button className="button" type="button" onClick={() => reset()}>Yenidən cəhd et</button>
    </section>
  )
}

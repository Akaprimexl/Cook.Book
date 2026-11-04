import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="empty-state">
      <p className="eyebrow">Səhifə tapılmadı</p>
      <h1>Bu resepti tapa bilmədik</h1>
      <p>Ünvanı yoxlayın və ya reseptlər siyahısına qayıdın.</p>
      <Link href="/reseptler" className="button">Reseptlərə qayıt</Link>
    </div>
  )
}

import Link from 'next/link'

export default function ReseptlerLayout({ children }) {
  return (
    <div className="recipes-layout">
      <aside className="recipes-sidebar">
        <p className="eyebrow">Resept bölməsi</p>
        <h2>Kateqoriyalar</h2>
        <Link href="/reseptler">Bütün reseptlər</Link>
        <p className="sidebar-note">Şorbalar · Əsas yeməklər · Desertlər · İçkilər</p>
      </aside>
      <div className="recipes-content">{children}</div>
    </div>
  )
}

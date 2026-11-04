import Link from 'next/link'

export default function ReseptKart({ resept }) {
  return (
    <Link href={`/reseptler/${resept.id}`} className="recipe-card">
      <img className="recipe-photo" src={resept.sekil} alt={resept.ad} />
      <div className="recipe-card-content">
        <span className="recipe-category">{resept.kateqoriya}</span>
        <h3>{resept.ad}</h3>
        <p>{resept.tesvir}</p>
        <p className="recipe-time">◷ &nbsp;{resept.muddet}</p>
      </div>
    </Link>
  )
}

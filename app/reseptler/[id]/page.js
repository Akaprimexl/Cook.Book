import Link from 'next/link'
import { notFound } from 'next/navigation'
import ReseptDetallari from '../../../components/ReseptDetallari'
import { getMeal, toRecipe } from '../../../lib/themealdb'

export default async function ReseptDetalSehifesi({ params }) {
  const { id } = await params
  const meal = await getMeal(id)
  if (!meal) notFound()

  const recipe = toRecipe(meal)

  return (
    <article className="detail">
      <Link href="/reseptler" className="back-link">← Reseptlərə qayıt</Link>
      <header>
        <p className="eyebrow">{recipe.kateqoriya} · {recipe.olke}</p>
        <h1>{recipe.ad}</h1>
        <p className="detail-description">Bu resept TheMealDB məlumat bazasından yüklənib.</p>
      </header>
      {recipe.sekil ? <img className="detail-photo" src={recipe.sekil} alt={recipe.ad} /> : null}
      <ReseptDetallari resept={recipe} />
      <p className="api-credit">Məlumat mənbəyi: <a href={meal.strSource || 'https://www.themealdb.com/'} target="_blank" rel="noreferrer">TheMealDB</a></p>
    </article>
  )
}


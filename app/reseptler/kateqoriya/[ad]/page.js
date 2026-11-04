import Link from 'next/link'
import { notFound } from 'next/navigation'
import ReseptKart from '../../../../components/ReseptKart'
import { getCategories, getMealsByCategory, toRecipeCard } from '../../../../lib/themealdb'

export default async function KateqoriyaSehifesi({ params }) {
  const { ad } = await params
  const categoryName = ad
  const categories = await getCategories()
  const category = categories.find((item) => item.strCategory.toLowerCase() === categoryName.toLowerCase())
  if (!category) notFound()

  const meals = await getMealsByCategory(category.strCategory)
  const recipes = meals.map(toRecipeCard)

  return (
    <section>
      <Link href="/" className="back-link">← Kateqoriyalara qayıt</Link>
      <div className="page-intro">
        <p className="eyebrow">TheMealDB kateqoriyası</p>
        <h1>{category.strCategory}</h1>
        <p>{recipes.length} resept tapıldı</p>
      </div>
      {recipes.length ? (
        <div className="recipe-grid">{recipes.map((recipe) => <ReseptKart key={recipe.id} resept={recipe} />)}</div>
      ) : <div className="empty-state"><h2>Bu kateqoriyada resept tapılmadı</h2><Link href="/reseptler">Bütün reseptlərə bax</Link></div>}
    </section>
  )
}


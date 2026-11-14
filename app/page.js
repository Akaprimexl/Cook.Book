import Link from 'next/link'
import { getCategories, getMealsByCategory, toRecipeCard } from '../lib/themealdb'
import ReseptKart from '../components/ReseptKart'
import CommunityPreview from '../components/CommunityPreview'

export default async function AnaSehife() {
  const categories = await getCategories()
  const popularRecipes = (await getMealsByCategory('Chicken')).slice(0, 6).map(toRecipeCard)

  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <p className="eyebrow">CookBook · TheMealDB</p>
          <h1>Bu gün nə bişirək?</h1>
          <p>Real reseptləri axtarın, şəkillərinə baxın və addım-addım hazırlayın.</p>
          <Link href="/reseptler" className="button">Reseptləri kəşf et <span aria-hidden="true">↗</span></Link>
          <Link href="/resept-yarat" className="button button-outline">Resept yarat <span aria-hidden="true">＋</span></Link>
        </div>
      </section>

      <section className="section" aria-labelledby="popular-title">
        <div className="section-heading"><div><p className="eyebrow">TheMealDB-dən</p><h2 id="popular-title">Populyar reseptlər</h2></div><Link href="/reseptler" className="text-link">Bütün reseptlər →</Link></div>
        {popularRecipes.length ? <div className="recipe-grid">{popularRecipes.map((recipe) => <ReseptKart key={recipe.id} resept={recipe}/>)}</div> : <p className="empty-state">Hazırda resept tapılmadı.</p>}
      </section>
      <CommunityPreview/>

      <section className="section" aria-labelledby="category-title">
        <div className="section-heading">
          <div><p className="eyebrow">TheMealDB-dən canlı məlumat</p><h2 id="category-title">Kateqoriyalar</h2></div>
          <p>{categories.length} kateqoriya</p>
        </div>
        {categories.length ? (
          <div className="category-grid">
            {categories.map((category) => (
              <Link
                href={'/reseptler/kateqoriya/' + encodeURIComponent(category.strCategory)}
                className="category-card category-card-photo"
                key={category.idCategory}
              >
                <img className="category-photo" src={category.strCategoryThumb} alt="" />
                <div><h3>{category.strCategory}</h3><p>Reseptlərə bax →</p></div>
              </Link>
            ))}
          </div>
        ) : <p className="empty-state">Hazırda kateqoriya tapılmadı.</p>}
      </section>
    </>
  )
}

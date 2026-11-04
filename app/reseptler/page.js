import Link from 'next/link'
import ReseptKart from '../../components/ReseptKart'
import { searchMeals, toRecipeCard } from '../../lib/themealdb'

export default async function ReseptlerSehifesi({ searchParams }) {
  const params = await searchParams
  const query = params?.q?.trim() || ''
  const meals = await searchMeals(query)
  const recipes = meals.map(toRecipeCard)

  return (
    <section>
      <div className="page-intro">
        <p className="eyebrow">TheMealDB reseptləri</p>
        <h1>{query ? 'Axtarış: ' + query : 'Reseptlər'}</h1>
        <p>{recipes.length} resept tapıldı</p>
      </div>

      <form className="recipe-search" action="/reseptler">
        <label htmlFor="recipe-query">Yemək adına görə axtar</label>
        <div className="search-row">
          <input id="recipe-query" name="q" defaultValue={query} placeholder="Məsələn: chicken, pasta, soup" />
          <button className="button" type="submit">Axtar</button>
        </div>
        <small>TheMealDB-də daha çox nəticə üçün yeməyin adını ingiliscə yazın.</small>
      </form>

      {recipes.length ? (
        <div className="recipe-grid">{recipes.map((recipe) => <ReseptKart key={recipe.id} resept={recipe} />)}</div>
      ) : (
        <div className="empty-state">
          <h2>Resept tapılmadı</h2>
          <p>Başqa yemək adı yazın və ya kateqoriyalardan birini seçin.</p>
          <Link className="text-link" href="/">Ana səhifəyə qayıt</Link>
        </div>
      )}
      <p className="api-credit">Məlumat mənbəyi: <a href="https://www.themealdb.com/" target="_blank" rel="noreferrer">TheMealDB</a></p>
    </section>
  )
}

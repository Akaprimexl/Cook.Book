'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import FavoriteButton from '../../components/FavoriteButton'
import ShoppingAddButton from '../../components/ShoppingAddButton'
import RecipeReactions from '../../components/RecipeReactions'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, getDocs, limit, onSnapshot, orderBy, query, startAfter } from 'firebase/firestore'
import { auth, db, firebaseConfigured } from '../../lib/firebase'

export default function IcmaPage() {
  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(!firebaseConfigured || !auth)
  const [recipes, setRecipes] = useState([])
  const [lastVisible, setLastVisible] = useState(null)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [maxMinutes, setMaxMinutes] = useState('all')
  const [minRating, setMinRating] = useState('all')
  const [ratingAverages, setRatingAverages] = useState({})
  const [error, setError] = useState('')

  useEffect(() => {
    if (!auth) return
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setAuthReady(true)
    })
  }, [])

  useEffect(() => {
    if (!authReady || !user || !db) return
    return onSnapshot(query(collection(db, 'recipes'), orderBy('createdAt', 'desc'), limit(12)), (snapshot) => {
      setRecipes((old) => {
        const firstPage = snapshot.docs.map((recipeDoc) => ({ id: recipeDoc.id, ...recipeDoc.data() }))
        const firstIds = new Set(firstPage.map((item) => item.id))
        const older = old.filter((item) => !firstIds.has(item.id))
        return [...firstPage, ...older]
      })
      setLastVisible(snapshot.docs.at(-1) || null)
      setHasMore(snapshot.docs.length === 12)
      setError('')
      setLoading(false)
    }, (loadError) => {
      setError(loadError.code === 'permission-denied'
        ? 'İcma reseptlərini oxumaq üçün yenilənmiş Firestore qaydalarını yayımla.'
        : 'Reseptləri yükləmək alınmadı. İnternet bağlantısını yoxla.')
      setLoading(false)
    })
  }, [authReady, user])

  useEffect(() => {
    if (!user || !db || !recipes.length) return
    let active = true
    Promise.all(recipes.map(async (recipe) => {
      const ratings = await getDocs(collection(db, 'recipes', recipe.id, 'ratings'))
      const scores = ratings.docs.map((item) => Number(item.data().value || 0)).filter(Boolean)
      return [recipe.id, scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0]
    })).then((entries) => { if (active) setRatingAverages(Object.fromEntries(entries)) }).catch(() => {})
    return () => { active = false }
  }, [user, recipes])

  async function loadMore() {
    if (!lastVisible || loadingMore) return
    setLoadingMore(true)
    try {
      const next = await getDocs(query(collection(db, 'recipes'), orderBy('createdAt', 'desc'), startAfter(lastVisible), limit(12)))
      const nextRecipes = next.docs.map((recipeDoc) => ({ id: recipeDoc.id, ...recipeDoc.data() }))
      setRecipes((old) => [...old, ...nextRecipes.filter((item) => !old.some((existing) => existing.id === item.id))])
      setLastVisible(next.docs.at(-1) || lastVisible)
      setHasMore(next.docs.length === 12)
    } catch { setError('Daha çox resept yüklənmədi.'); }
    finally { setLoadingMore(false) }
  }

  const visibleRecipes = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase('az')
    return recipes.filter((recipe) => {
      const matchesText = !needle || [recipe.ad, recipe.kateqoriya, recipe.tesvir, ...(recipe.inqrediyentler || [])]
        .some((value) => String(value || '').toLocaleLowerCase('az').includes(needle))
      const matchesCategory = category === 'all' || recipe.kateqoriya === category
      const minutes = Number(String(recipe.muddet || '').match(/\d+/)?.[0] || 0)
      const matchesTime = maxMinutes === 'all' || (minutes > 0 && minutes <= Number(maxMinutes))
      const matchesRating = minRating === 'all' || (ratingAverages[recipe.id] || 0) >= Number(minRating)
      return matchesText && matchesCategory && matchesTime && matchesRating
    })
  }, [recipes, search, category, maxMinutes, minRating, ratingAverages])

  if (!firebaseConfigured) return <section className="empty-state"><h1>Firebase sazlanmayıb</h1><p>Ortaq reseptlər üçün `.env.local` faylındakı ümumi Firebase konfiqurasiyasını yoxla.</p></section>
  if (!authReady) return <div className="loading-state"><span className="loading-spinner"/><p>Hesab yoxlanır…</p></div>
  if (!user) return <section className="empty-state"><h1>İcmaya qoşul</h1><p>İcma reseptlərini görmək üçün hesaba daxil ol.</p><Link className="button" href="/login">Daxil ol</Link></section>

  return <section className="community-page">
    <header className="page-intro community-intro"><p className="eyebrow">Birlikdə bişirək</p><h1>CookBook icması</h1><p>İcma üzvlərinin paylaşdığı reseptləri kəşf et və öz reseptini əlavə et.</p></header>
    <div className="community-toolbar"><label htmlFor="community-search">Reseptlərdə axtar</label><input id="community-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Ad, ərzaq və ya kateqoriya…"/><Link className="button" href="/resept-yarat">＋ Resept paylaş</Link></div>
    <div className="community-filters"><label>Kateqoriya<select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">Hamısı</option>{[...new Set(recipes.map((recipe) => recipe.kateqoriya).filter(Boolean))].map((item) => <option key={item}>{item}</option>)}</select></label><label>Hazırlanma vaxtı<select value={maxMinutes} onChange={(event) => setMaxMinutes(event.target.value)}><option value="all">İstənilən vaxt</option><option value="30">30 dəqiqəyədək</option><option value="60">60 dəqiqəyədək</option></select></label><label>Reytinq<select value={minRating} onChange={(event) => setMinRating(event.target.value)}><option value="all">Hamısı</option><option value="3">★ 3+</option><option value="4">★ 4+</option></select></label></div>
    <div className="section-heading community-count"><div><h2>İcmanın reseptləri</h2><p>Üzvlər tərəfindən paylaşılan reseptlər</p></div><span>{visibleRecipes.length} resept</span></div>
    {error && <p className="auth-message auth-message-error" role="alert">{error}</p>}
    {loading ? <div className="loading-state"><span className="loading-spinner"/><p>Reseptlər yüklənir…</p></div>
      : visibleRecipes.length ? <><div className="recipe-grid">{visibleRecipes.map((recipe) => <article className="recipe-card community-card" key={recipe.id}>
        <FavoriteButton recipe={recipe} source="community" />
        {recipe.imageUrl && <img className="recipe-photo" src={recipe.imageUrl} alt={recipe.ad}/>}
        <div className="recipe-card-content">
          <Link className="community-author" href={`/istifadeci/${recipe.ownerId}`}>{recipe.ownerPhoto ? <img src={recipe.ownerPhoto} alt=""/> : <span>{(recipe.ownerName || 'C').slice(0, 1).toUpperCase()}</span>}<div><strong>{recipe.ownerName || 'CookBook üzvü'}</strong><small>{recipe.ownerId === user.uid ? 'Sənin reseptin' : 'İcma üzvü'}</small></div></Link>
          <span className="recipe-category">{recipe.kateqoriya}</span><h3>{recipe.ad}</h3><p>{recipe.tesvir}</p><p className="recipe-time">◷ &nbsp;{recipe.muddet}</p>
          <span className="community-card-rating">★ {ratingAverages[recipe.id] ? ratingAverages[recipe.id].toFixed(1) : '—'}</span>
          <details><summary>Ərzaqlar və hazırlanma</summary><strong>Ərzaqlar</strong><ul>{(recipe.inqrediyentler || []).map((item, index) => <li key={index}>{item}</li>)}</ul><strong>Hazırlanma qaydası</strong><ol>{(recipe.addimlar || []).map((item, index) => <li key={index}>{item}</li>)}</ol></details>
          <Link href={`/icma/${recipe.id}`} className="community-open-link">Resepti aç, bəyən və şərh yaz →</Link>
          <RecipeReactions recipeId={recipe.id}/>
          <ShoppingAddButton ingredients={recipe.inqrediyentler || []} recipeName={recipe.ad}/>
        </div>
      </article>)}</div>
        {hasMore && <div className="load-more-wrap"><button className="button button-outline-dark" type="button" onClick={loadMore} disabled={loadingMore}>{loadingMore ? 'Yüklənir…' : 'Daha çox resept yüklə'}</button></div>}</>
        : <div className="empty-state community-empty"><h2>{search ? 'Uyğun resept tapılmadı' : 'İcmada hələ resept yoxdur'}</h2><p>{search ? 'Başqa sözlə axtar.' : 'İlk resepti sən paylaş və icmanı başlat.'}</p>{!search && <Link className="button" href="/resept-yarat">Resept paylaş</Link>}</div>}
  </section>
}

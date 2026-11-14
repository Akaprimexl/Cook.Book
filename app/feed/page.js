'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import RecipeReactions from '../../components/RecipeReactions'
import { auth, db, firebaseConfigured } from '../../lib/firebase'

export default function FeedPage() {
  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(!auth)
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(Boolean(auth))
  const [error, setError] = useState('')

  useEffect(() => { if (auth) return onAuthStateChanged(auth, (currentUser) => { setUser(currentUser); setAuthReady(true); setLoading(Boolean(currentUser)) }) }, [])
  useEffect(() => {
    if (!authReady || !user || !db) return
    let recipeUnsubscribers = []
    const unsubscribeFollowing = onSnapshot(collection(db, 'users', user.uid, 'following'), (snapshot) => {
      recipeUnsubscribers.forEach((unsubscribe) => unsubscribe())
      recipeUnsubscribers = []
      const ids = snapshot.docs.map((item) => item.id).slice(0, 30)
      if (!ids.length) { setRecipes([]); setLoading(false); return }
      const pages = new Map()
      ids.forEach((uid, index) => {
        const key = `group-${index}`
        const recipeQuery = query(collection(db, 'recipes'), where('ownerId', '==', uid), orderBy('createdAt', 'desc'), limit(20))
        recipeUnsubscribers.push(onSnapshot(recipeQuery, (recipeSnapshot) => {
          pages.set(key, recipeSnapshot.docs.map((item) => ({ id: item.id, ...item.data() })))
          setRecipes([...pages.values()].flat().sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)))
          setError(''); setLoading(false)
        }, () => { setError('Feed yüklənmədi. Firestore qaydalarını yoxla.'); setLoading(false) }))
      })
    }, () => { setError('İzlədiklərin oxunmadı. Firestore qaydalarını yayımla.'); setLoading(false) })
    return () => { unsubscribeFollowing(); recipeUnsubscribers.forEach((unsubscribe) => unsubscribe()) }
  }, [authReady, user])

  if (!firebaseConfigured) return <section className="empty-state"><h1>Firebase sazlanmayıb</h1></section>
  if (!authReady) return <div className="loading-state"><span className="loading-spinner"/><p>Hesab yoxlanır…</p></div>
  if (!user) return <section className="empty-state"><h1>Feed-ə bax</h1><p>İzlədiyin aşpazların reseptlərini görmək üçün daxil ol.</p><Link className="button" href="/login">Daxil ol</Link></section>
  return <section className="community-page"><header className="page-intro"><p className="eyebrow">İzlədiklərin</p><h1>Resept feed-i</h1><p>İzlədiyin aşpazların son paylaşımları.</p></header>
    {error && <p className="auth-message auth-message-error" role="alert">{error}</p>}
    {loading ? <div className="recipe-grid">{[1, 2, 3].map((item) => <div className="recipe-skeleton" key={item}/>)}</div> : recipes.length ? <div className="recipe-grid">{recipes.map((recipe) => <article className="recipe-card community-card" key={recipe.id}>{recipe.imageUrl && <img className="recipe-photo" src={recipe.imageUrl} alt={recipe.ad}/>}<div className="recipe-card-content"><p className="community-author">{recipe.ownerName || 'CookBook üzvü'}</p><span className="recipe-category">{recipe.kateqoriya}</span><h3>{recipe.ad}</h3><p>{recipe.tesvir}</p><Link className="community-open-link" href={`/icma/${recipe.id}`}>Resepti aç →</Link><RecipeReactions recipeId={recipe.id}/></div></article>)}</div> : <div className="empty-state"><h2>Feed hələ boşdur</h2><p>İcmada xoşuna gələn aşpazın adına basıb onu izlə.</p><Link className="button" href="/icma">İcmaya bax</Link></div>}
  </section>
}

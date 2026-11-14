'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, onSnapshot } from 'firebase/firestore'
import FavoriteButton from '../../components/FavoriteButton'
import ShoppingAddButton from '../../components/ShoppingAddButton'
import { auth, db, firebaseConfigured } from '../../lib/firebase'

export default function SevimlilerPage() {
  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(!auth)
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(Boolean(auth))
  const [error, setError] = useState('')

  useEffect(() => {
    if (!auth) return
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); setAuthReady(true); setLoading(Boolean(currentUser))
      if (!currentUser) setFavorites([])
    })
  }, [])

  useEffect(() => {
    if (!authReady) return
    if (!user || !db) return
    return onSnapshot(collection(db, 'users', user.uid, 'favorites'), (snapshot) => {
      const items = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
      items.sort((a, b) => (b.savedAt?.toMillis?.() || 0) - (a.savedAt?.toMillis?.() || 0))
      setFavorites(items); setError(''); setLoading(false)
    }, (loadError) => {
      setError(loadError.code === 'permission-denied' ? 'Sevimliləri görmək üçün Firestore qaydalarını yayımla.' : 'Sevimliləri yükləmək alınmadı.')
      setLoading(false)
    })
  }, [authReady, user])

  if (!firebaseConfigured) return <section className="empty-state"><h1>Firebase sazlanmayıb</h1><p>Sevimlilər üçün Firebase konfiqurasiyasını yoxla.</p></section>
  if (!authReady) return <div className="loading-state"><span className="loading-spinner"/><p>Hesab yoxlanır…</p></div>
  if (!user) return <section className="empty-state"><h1>Sevimlilərini saxla</h1><p>Reseptləri sevimlilərə əlavə etmək üçün hesaba daxil ol.</p><Link href="/login" className="button">Daxil ol</Link></section>

  return <section className="section-page">
    <header className="page-intro"><p className="eyebrow">Özün üçün saxla</p><h1>Sevimlilər</h1><p>Sevdiyin reseptlər hesabınla birlikdə saxlanılır.</p></header>
    {error && <p className="auth-message auth-message-error" role="alert">{error}</p>}
    {loading ? <div className="loading-state"><span className="loading-spinner"/><p>Sevimlilər yüklənir…</p></div> : favorites.length ? <div className="recipe-grid">{favorites.map((saved) => {
      const recipe = { id: saved.recipeId, ad: saved.name, kateqoriya: saved.category, tesvir: saved.description, sekil: saved.imageUrl, muddet: saved.duration, inqrediyentler: saved.ingredients, addimlar: saved.steps, ownerName: saved.ownerName }
      const target = saved.source === 'mealdb' ? `/reseptler/${encodeURIComponent(saved.recipeId)}` : '/icma'
      return <article className="recipe-card favorite-card" key={saved.id}>
        <FavoriteButton recipe={recipe} source={saved.source}/>
        {saved.imageUrl && <img className="recipe-photo" src={saved.imageUrl} alt={saved.name}/>}
        <div className="recipe-card-content"><span className="recipe-category">{saved.category}</span><h3>{saved.name}</h3><p>{saved.description}</p>{saved.ownerName && <small>Paylaşan: {saved.ownerName}</small>}{saved.duration && <p className="recipe-time">◷ &nbsp;{saved.duration}</p>}
          {saved.source === 'community' && saved.ingredients?.length > 0 && <details><summary>Ərzaqlar və hazırlanma</summary><ul>{saved.ingredients.map((item, index) => <li key={index}>{typeof item === 'string' ? item : [item.olcu, item.ad].filter(Boolean).join(' ')}</li>)}</ul><ol>{(saved.steps || []).map((step, index) => <li key={index}>{step}</li>)}</ol></details>}
          {saved.source === 'community' && saved.ingredients?.length > 0 && <ShoppingAddButton ingredients={saved.ingredients} recipeName={saved.name}/>}
          <Link className="favorite-open-link" href={target}>{saved.source === 'mealdb' ? 'Resepti aç →' : 'İcmaya keç →'}</Link>
        </div>
      </article>
    })}</div> : <div className="empty-state"><h2>Hələ sevimli resept yoxdur</h2><p>Resept kartındakı ürəyə basaraq onları burada topla.</p><Link href="/reseptler" className="button">Reseptlərə bax</Link></div>}
  </section>
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'

export default function CommunityPreview() {
  const [user, setUser] = useState(null)
  const [recipes, setRecipes] = useState([])

  useEffect(() => { if (auth) return onAuthStateChanged(auth, setUser) }, [])
  useEffect(() => {
    if (!user || !db) return
    return onSnapshot(query(collection(db, 'recipes'), orderBy('createdAt', 'desc'), limit(3)), (snapshot) => setRecipes(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))), () => {})
  }, [user])

  return <section className="section" aria-labelledby="community-preview-title">
    <div className="section-heading"><div><p className="eyebrow">İcmanın mətbəxindən</p><h2 id="community-preview-title">Yeni paylaşımlar</h2></div><Link href="/icma" className="text-link">Bütün icma reseptləri →</Link></div>
    {!user ? <div className="community-preview-login"><p>Üzvlərin reseptlərini görmək üçün hesabına daxil ol.</p><Link className="button" href="/login">Daxil ol</Link></div> : recipes.length ? <div className="recipe-grid">{recipes.map((recipe) => <article className="recipe-card community-card" key={recipe.id}>{recipe.imageUrl && <img className="recipe-photo" src={recipe.imageUrl} alt={recipe.ad}/>}<div className="recipe-card-content"><span className="recipe-category">{recipe.kateqoriya}</span><h3>{recipe.ad}</h3><p>{recipe.tesvir}</p><Link className="community-open-link" href={`/icma/${recipe.id}`}>Resepti aç →</Link></div></article>)}</div> : <div className="empty-state"><p>İcma hələ ilk reseptləri gözləyir.</p><Link href="/resept-yarat">Resept paylaş</Link></div>}
  </section>
}

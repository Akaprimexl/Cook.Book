'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { onAuthStateChanged } from 'firebase/auth'
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore'
import FavoriteButton from './FavoriteButton'
import RecipeReactions from './RecipeReactions'
import ShoppingAddButton from './ShoppingAddButton'
import { auth, db, firebaseConfigured } from '../lib/firebase'

export default function CommunityRecipePage({ recipeId }) {
  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(!auth)
  const [recipe, setRecipe] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [commenting, setCommenting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!auth) return
    return onAuthStateChanged(auth, (currentUser) => { setUser(currentUser); setAuthReady(true) })
  }, [])

  useEffect(() => {
    if (!authReady || !user || !db) return
    return onSnapshot(doc(db, 'recipes', recipeId), (snapshot) => {
      setRecipe(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null)
      setLoading(false)
    }, (loadError) => { setError(loadError.code === 'permission-denied' ? 'Bu resepti oxumaq üçün Firestore qaydalarını yayımla.' : 'Resept yüklənmədi.'); setLoading(false) })
  }, [authReady, user, recipeId])

  useEffect(() => {
    if (!authReady || !user || !db) return
    return onSnapshot(query(collection(db, 'recipes', recipeId, 'comments'), orderBy('createdAt', 'asc')), (snapshot) => {
      setComments(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })))
      setError('')
    }, (loadError) => setError(loadError.code === 'permission-denied' ? 'Şərhlər üçün Firestore qaydalarını yayımla.' : 'Şərhlər yüklənmədi.'))
  }, [authReady, user, recipeId])

  async function addComment(event) {
    event.preventDefault()
    if (!user || !db || commenting) return
    const form = event.currentTarget
    const body = String(new FormData(form).get('comment') || '').trim()
    if (!body || body.length > 1000) return
    setCommenting(true); setError('')
    try {
      await addDoc(collection(db, 'recipes', recipeId, 'comments'), { body, authorId: user.uid, authorName: user.displayName || user.email?.split('@')[0] || 'CookBook üzvü', createdAt: serverTimestamp() })
      form.reset()
    } catch (writeError) { setError(writeError.code === 'permission-denied' ? 'Şərh yazmaq üçün Firestore qaydalarını yayımla.' : 'Şərhi göndərmək alınmadı.') }
    finally { setCommenting(false) }
  }

  async function removeComment(commentId) {
    try { await deleteDoc(doc(db, 'recipes', recipeId, 'comments', commentId)) }
    catch { setError('Yalnız öz şərhini silə bilərsən. Firestore qaydalarını yoxla.') }
  }

  if (!firebaseConfigured) return <section className="empty-state"><h1>Firebase sazlanmayıb</h1><p>İcma səhifəsi üçün Firebase sazlamasını yoxla.</p></section>
  if (!authReady) return <div className="loading-state"><span className="loading-spinner"/><p>Hesab yoxlanır…</p></div>
  if (!user) return <section className="empty-state"><h1>İcmaya qoşul</h1><p>Reseptə baxmaq və şərh yazmaq üçün hesaba daxil ol.</p><Link className="button" href="/login">Daxil ol</Link></section>
  if (loading) return <div className="loading-state"><span className="loading-spinner"/><p>Resept açılır…</p></div>
  if (!recipe) return <section className="empty-state"><h1>Resept tapılmadı</h1><Link href="/icma" className="button">İcmaya qayıt</Link></section>

  const ingredients = recipe.inqrediyentler || []
  const steps = recipe.addimlar || []
  return <article className="community-detail">
    <Link href="/icma" className="back-link">← İcmaya qayıt</Link>
    <header className="community-detail-heading"><div><p className="eyebrow">{recipe.kateqoriya} · {recipe.muddet}</p><h1>{recipe.ad}</h1><p className="detail-description">{recipe.tesvir}</p><Link className="community-author-link" href={`/istifadeci/${recipe.ownerId}`}>Paylaşan: {recipe.ownerName || 'CookBook üzvü'} →</Link></div><div className="community-detail-actions"><FavoriteButton recipe={{ ...recipe, id: recipe.id }} source="community"/><RecipeReactions recipeId={recipeId} showRating/></div></header>
    {recipe.imageUrl && <img className="detail-photo" src={recipe.imageUrl} alt={recipe.ad}/>}
    <div className="detail-panel"><div className="section-heading"><h2>Ərzaqlar</h2><ShoppingAddButton ingredients={ingredients} recipeName={recipe.ad}/></div><ul className="ingredient-list">{ingredients.map((item, index) => <li key={index}>{item}</li>)}</ul></div>
    <div className="detail-panel"><h2>Hazırlanma qaydası</h2><ol className="steps">{steps.map((step, index) => <li key={index}><span className="step-number">{index + 1}</span><span>{step}</span></li>)}</ol></div>
    <section className="comments-section detail-panel"><div className="section-heading"><h2>Şərhlər</h2><span>{comments.length}</span></div>
      <form className="comment-form" onSubmit={addComment}><label className="sr-only" htmlFor="community-comment">Şərh yaz</label><textarea id="community-comment" name="comment" placeholder="Bu resept haqqında fikrini yaz…" maxLength={1000} required/><button className="button" type="submit" disabled={commenting}>{commenting ? 'Göndərilir…' : 'Şərh yaz'}</button></form>
      {error && <p className="auth-message auth-message-error" role="alert">{error}</p>}
      {comments.length ? <ul className="comment-list">{comments.map((comment) => <li key={comment.id}><div className="comment-meta"><Link href={`/istifadeci/${comment.authorId}`}>{comment.authorName}</Link><time>{comment.createdAt?.toDate?.().toLocaleDateString('az-AZ') || 'İndi'}</time>{comment.authorId === user.uid && <button type="button" onClick={() => removeComment(comment.id)}>Sil</button>}</div><p>{comment.body}</p></li>)}</ul> : <p className="no-comments">Hələ şərh yoxdur. İlk fikrini sən yaz.</p>}
    </section>
  </article>
}

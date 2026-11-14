'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'

export default function RecipeReactions({ recipeId, showRating = false }) {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [likes, setLikes] = useState([])
  const [ratings, setRatings] = useState([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [ratingBusy, setRatingBusy] = useState(false)
  const [optimisticLiked, setOptimisticLiked] = useState(null)

  useEffect(() => {
    if (!auth) return
    return onAuthStateChanged(auth, setUser)
  }, [])

  useEffect(() => {
    if (!db || !recipeId) return
    const unsubscribeLikes = onSnapshot(collection(db, 'recipes', recipeId, 'likes'), (snapshot) => { setLikes(snapshot.docs.map((item) => item.id)); setOptimisticLiked(null) }, () => setError('Bəyənmələri yükləmək alınmadı.'))
    const unsubscribeRatings = onSnapshot(collection(db, 'recipes', recipeId, 'ratings'), (snapshot) => setRatings(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))), () => setError('Reytinqləri yükləmək alınmadı.'))
    return () => { unsubscribeLikes(); unsubscribeRatings() }
  }, [recipeId])

  const liked = optimisticLiked === null ? Boolean(user && likes.includes(user.uid)) : optimisticLiked
  const myRating = ratings.find((item) => item.id === user?.uid)?.value || 0
  const average = useMemo(() => ratings.length ? ratings.reduce((sum, item) => sum + Number(item.value || 0), 0) / ratings.length : 0, [ratings])

  async function toggleLike() {
    if (!user) { router.push('/login'); return }
    if (busy) return
    const nextLiked = !liked
    setOptimisticLiked(nextLiked)
    setBusy(true); setError('')
    const likeRef = doc(db, 'recipes', recipeId, 'likes', user.uid)
    try {
      if (!nextLiked) await deleteDoc(likeRef)
      else await setDoc(likeRef, { userId: user.uid, createdAt: serverTimestamp() })
    } catch (writeError) { setOptimisticLiked(null); setError(writeError.code === 'permission-denied' ? 'Bəyənmə üçün Firestore qaydalarını yayımla.' : 'Bəyənməni dəyişmək alınmadı.') }
    finally { setBusy(false) }
  }

  async function rate(value) {
    if (!user) { router.push('/login'); return }
    if (ratingBusy) return
    setRatingBusy(true); setError('')
    try { await setDoc(doc(db, 'recipes', recipeId, 'ratings', user.uid), { userId: user.uid, value, updatedAt: serverTimestamp() }) }
    catch (writeError) { setError(writeError.code === 'permission-denied' ? 'Reytinq üçün Firestore qaydalarını yayımla.' : 'Reytinqi saxlamaq alınmadı.') }
    finally { setRatingBusy(false) }
  }

  return <div className={showRating ? 'recipe-reactions expanded' : 'recipe-reactions'}>
    <button className={liked ? 'like-button liked' : 'like-button'} type="button" onClick={toggleLike} disabled={busy} aria-pressed={liked} aria-label={liked ? 'Bəyənməni geri götür' : 'Resepti bəyən'}>♥ <span>{likes.length}</span></button>
    {showRating && <div className="recipe-rating"><span className="rating-average">★ {average ? average.toFixed(1) : '—'}</span><span className="rating-count">{ratings.length} səs</span><div className="rating-stars" role="group" aria-label="Reseptə 1-dən 5-ə qədər qiymət ver">{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" onClick={() => rate(value)} disabled={ratingBusy} aria-label={`${value} ulduz ver`} aria-pressed={myRating === value} className={value <= myRating ? 'active' : ''}>★</button>)}</div></div>}
    {error && <span className="reaction-error" role="alert">{error}</span>}
  </div>
}

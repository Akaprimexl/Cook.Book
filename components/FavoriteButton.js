'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { deleteDoc, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'

function favoriteKey(source, id) {
  return `${source}_${encodeURIComponent(String(id))}`
}

export default function FavoriteButton({ recipe, source = 'mealdb' }) {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!auth) return
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      if (!currentUser) setSaved(false)
    })
  }, [])

  useEffect(() => {
    if (!user || !db || !recipe?.id) return
    return onSnapshot(doc(db, 'users', user.uid, 'favorites', favoriteKey(source, recipe.id)), (snapshot) => {
      setSaved(snapshot.exists())
      setError('')
    }, () => setError('Sevimliləri yükləmək alınmadı. Firestore qaydalarını yoxla.'))
  }, [user, recipe?.id, source])

  async function toggleFavorite(event) {
    event.preventDefault()
    event.stopPropagation()
    if (!user) { router.push('/login'); return }
    if (!db || busy) return
    setBusy(true); setError('')
    const favoriteRef = doc(db, 'users', user.uid, 'favorites', favoriteKey(source, recipe.id))
    try {
      if (saved) await deleteDoc(favoriteRef)
      else await setDoc(favoriteRef, {
        source,
        recipeId: String(recipe.id),
        name: recipe.ad || recipe.name || 'Resept',
        category: recipe.kateqoriya || recipe.category || 'Resept',
        description: recipe.tesvir || recipe.description || '',
        imageUrl: recipe.sekil || recipe.imageUrl || '',
        duration: recipe.muddet || recipe.duration || '',
        ingredients: recipe.inqrediyentler || recipe.ingredients || [],
        steps: recipe.addimlar || recipe.steps || [],
        ownerName: recipe.ownerName || '',
        savedAt: serverTimestamp(),
      })
    } catch (saveError) {
      setError(saveError.code === 'permission-denied' ? 'Sevimliləri saxlamaq üçün Firestore qaydalarını yayımla.' : 'Sevimlini saxlamaq alınmadı. Yenidən cəhd et.')
    } finally { setBusy(false) }
  }

  return <>
    <button type="button" className={saved ? 'favorite-button saved' : 'favorite-button'} onClick={toggleFavorite} disabled={busy} aria-label={saved ? 'Sevimlilərdən çıxar' : 'Sevimlilərə əlavə et'} title={saved ? 'Sevimlilərdən çıxar' : 'Sevimlilərə əlavə et'} aria-pressed={saved}>{saved ? '♥' : '♡'}</button>
    {error && <span className="favorite-error" role="alert">{error}</span>}
  </>
}

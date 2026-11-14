'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, doc, getCountFromServer, getDoc, getDocs, onSnapshot, query, where } from 'firebase/firestore'
import FollowButton from '../../../components/FollowButton'
import RecipeReactions from '../../../components/RecipeReactions'
import { auth, db, firebaseConfigured } from '../../../lib/firebase'

export default function PublicUserPage() {
  const { uid } = useParams()
  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(!auth)
  const [profile, setProfile] = useState(null)
  const [recipes, setRecipes] = useState([])
  const [stats, setStats] = useState({ likes: 0, rating: '—' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { if (auth) return onAuthStateChanged(auth, (currentUser) => { setUser(currentUser); setAuthReady(true) }) }, [])
  useEffect(() => {
    if (!authReady || !user || !db || !uid) return
    let unsubscribeRecipes
    getDoc(doc(db, 'users', uid)).then((snapshot) => {
      if (!snapshot.exists() || snapshot.data().profileVisibility === 'private') { setError('Bu profil açıq deyil.'); setLoading(false); return }
      setProfile(snapshot.data())
      const userRecipes = query(collection(db, 'recipes'), where('ownerId', '==', uid))
      unsubscribeRecipes = onSnapshot(userRecipes, (recipeSnapshot) => {
        const items = recipeSnapshot.docs.map((item) => ({ id: item.id, ...item.data() })).sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
        setRecipes(items); setLoading(false)
        Promise.all(items.map(async (item) => {
          const likes = await getCountFromServer(collection(db, 'recipes', item.id, 'likes'))
          const ratings = await getDocs(collection(db, 'recipes', item.id, 'ratings'))
          return { likes: likes.data().count, ratings: ratings.docs.map((rating) => rating.data().value) }
        })).then((values) => {
          const likes = values.reduce((sum, value) => sum + value.likes, 0)
          const votes = values.flatMap((value) => value.ratings)
          setStats({ likes, rating: votes.length ? (votes.reduce((sum, value) => sum + value, 0) / votes.length).toFixed(1) : '—' })
        }).catch(() => {})
      }, (recipeError) => { setError(recipeError.code === 'permission-denied' ? 'Publik reseptlər üçün Firestore qaydalarını yayımla.' : 'Reseptlər yüklənmədi.'); setLoading(false) })
    }).catch((profileError) => { setError(profileError.code === 'permission-denied' ? 'Bu profil bağlıdır və ya Firestore qaydaları yayımlanmayıb.' : 'Profil yüklənmədi.'); setLoading(false) })
    return () => unsubscribeRecipes?.()
  }, [authReady, user, uid])

  if (!firebaseConfigured) return <section className="empty-state"><h1>Firebase sazlanmayıb</h1></section>
  if (!authReady) return <div className="loading-state"><span className="loading-spinner"/><p>Hesab yoxlanır…</p></div>
  if (!user) return <section className="empty-state"><h1>İcma profillərinə bax</h1><Link className="button" href="/login">Daxil ol</Link></section>
  if (loading) return <div className="loading-state"><span className="loading-spinner"/><p>Profil yüklənir…</p></div>
  if (!profile) return <section className="empty-state"><h1>Profil tapılmadı</h1><p>{error}</p><Link href="/icma">İcmaya qayıt</Link></section>
  const name = profile.fullName || 'CookBook üzvü'
  return <section className="public-profile">
    <Link href="/icma" className="back-link">← İcmaya qayıt</Link>
    <header className="public-profile-header">
      {profile.avatarUrl ? <img className="public-profile-avatar" src={profile.avatarUrl} alt=""/> : <span className="public-profile-avatar initials">{name.slice(0, 1).toUpperCase()}</span>}
      <div><p className="eyebrow">CookBook icması</p><h1>{name}</h1>{profile.username && <p>@{profile.username}</p>}{profile.bio && <p className="profile-bio">{profile.bio}</p>}{profile.location && <p>{profile.location}</p>}</div>
      <FollowButton targetId={uid}/>
    </header>
    {error && <p className="auth-message auth-message-error" role="alert">{error}</p>}
    <div className="profile-statistics"><div><strong>{recipes.length}</strong><span>Resept</span></div><div><strong>{stats.likes}</strong><span>Bəyənmə</span></div><div><strong>★ {stats.rating}</strong><span>Orta reytinq</span></div></div>
    <div className="section-heading"><div><p className="eyebrow">Bu aşpazın mətbəxindən</p><h2>Reseptləri</h2></div></div>
    {recipes.length ? <div className="recipe-grid">{recipes.map((recipe) => <article className="recipe-card" key={recipe.id}>{recipe.imageUrl && <img className="recipe-photo" src={recipe.imageUrl} alt={recipe.ad}/>}<div className="recipe-card-content"><span className="recipe-category">{recipe.kateqoriya}</span><h3>{recipe.ad}</h3><p>{recipe.tesvir}</p><Link className="community-open-link" href={`/icma/${recipe.id}`}>Resepti aç →</Link><RecipeReactions recipeId={recipe.id}/></div></article>)}</div> : <div className="empty-state"><p>Hələ resept paylaşmayıb.</p></div>}
  </section>
}

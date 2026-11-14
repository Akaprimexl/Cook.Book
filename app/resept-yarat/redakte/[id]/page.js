'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { auth, db, firebaseConfigured, storage } from '../../../../lib/firebase'

const kateqoriyalar = ['Əsas yeməklər', 'Şorbalar', 'Salatlar', 'Desertlər', 'İçkilər', 'Digər']

export default function RecipeEditPage() {
  const { id } = useParams()
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(!auth)
  const [recipe, setRecipe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!auth) return
    return onAuthStateChanged(auth, (currentUser) => { setUser(currentUser); setReady(true); if (!currentUser) setLoading(false) })
  }, [])

  useEffect(() => {
    if (!ready) return
    if (!user || !db) return
    getDoc(doc(db, 'recipes', id)).then((snapshot) => {
      if (!snapshot.exists() || snapshot.data().ownerId !== user.uid) { setMessage('Bu resepti redaktə etmək icazən yoxdur.'); setLoading(false); return }
      setRecipe({ id: snapshot.id, ...snapshot.data() }); setLoading(false)
    }).catch(() => { setMessage('Resept yüklənmədi. Firestore qaydalarını yoxla.'); setLoading(false) })
  }, [ready, user, id])

  async function save(event) {
    event.preventDefault()
    if (!user || !recipe || !db) return
    const form = event.currentTarget
    const values = new FormData(form)
    const image = values.get('image')
    if (image?.size && (image.size > 5 * 1024 * 1024 || !['image/jpeg', 'image/png'].includes(image.type))) {
      setMessage('Şəkil JPG və ya PNG formatında və 5 MB-dan kiçik olmalıdır.')
      return
    }
    setSaving(true); setMessage('')
    try {
      let imageUrl = recipe.imageUrl || ''
      if (image?.size) {
        if (!storage) throw new Error('storage/not-configured')
        const imageRef = ref(storage, `recipes/${user.uid}/${id}/${Date.now()}-${image.name.replace(/[^\w.-]/g, '-')}`)
        await uploadBytes(imageRef, image, { contentType: image.type })
        imageUrl = await getDownloadURL(imageRef)
      }
      await updateDoc(doc(db, 'recipes', id), {
        ad: String(values.get('ad')).trim(),
        kateqoriya: String(values.get('kateqoriya')),
        muddet: String(values.get('muddet')).trim(),
        tesvir: String(values.get('tesvir')).trim(),
        inqrediyentler: String(values.get('inqrediyentler')).split('\n').map((item) => item.trim()).filter(Boolean),
        addimlar: String(values.get('addimlar')).split('\n').map((item) => item.trim()).filter(Boolean),
        ownerName: recipe.ownerName || user.displayName || user.email?.split('@')[0] || 'CookBook üzvü',
        ownerPhoto: recipe.ownerPhoto || user.photoURL || '',
        imageUrl,
        updatedAt: serverTimestamp(),
      })
      router.push('/profil'); router.refresh()
    } catch (error) { setMessage(error.code === 'permission-denied' ? 'Resepti dəyişmək üçün Firestore qaydalarını yayımla.' : error.message === 'storage/not-configured' ? 'Firebase Storage sazlanmayıb.' : 'Dəyişiklikləri saxlamaq alınmadı.') }
    finally { setSaving(false) }
  }

  if (!firebaseConfigured) return <section className="empty-state"><h1>Firebase sazlanmayıb</h1></section>
  if (!ready || loading) return <div className="loading-state"><span className="loading-spinner"/><p>Resept yoxlanır…</p></div>
  if (!user) return <section className="empty-state"><h1>Daxil ol</h1><Link href="/login" className="button">Giriş et</Link></section>
  if (!recipe) return <section className="empty-state"><h1>Resept redaktə edilmir</h1><p>{message}</p><Link href="/profil" className="button">Profilə qayıt</Link></section>

  return <section className="create-recipe-page"><Link className="back-link" href="/profil">← Profilə qayıt</Link><header className="page-intro"><p className="eyebrow">Öz reseptin</p><h1>Resepti redaktə et</h1></header>
    <form className="recipe-form" onSubmit={save}>
      <label className="recipe-field">Reseptin adı<input name="ad" defaultValue={recipe.ad} required minLength={3} maxLength={80}/></label>
      <div className="recipe-fields-row"><label className="recipe-field">Kateqoriya<select name="kateqoriya" defaultValue={recipe.kateqoriya}>{kateqoriyalar.map((item) => <option key={item}>{item}</option>)}</select></label><label className="recipe-field">Hazırlanma müddəti<input name="muddet" defaultValue={recipe.muddet} required maxLength={30}/></label></div>
      <label className="recipe-field">Qısa təsvir<textarea name="tesvir" defaultValue={recipe.tesvir} required minLength={8} maxLength={300}/></label>
      <label className="recipe-field">Ərzaqlar<textarea name="inqrediyentler" defaultValue={(recipe.inqrediyentler || []).join('\n')} required minLength={2}/></label>
      <label className="recipe-field">Hazırlanma qaydası<textarea name="addimlar" defaultValue={(recipe.addimlar || []).join('\n')} required minLength={2}/></label>
      {recipe.imageUrl && <img className="edit-recipe-image" src={recipe.imageUrl} alt={recipe.ad}/>}<label className="recipe-field">Şəkli dəyiş <input type="file" name="image" accept="image/jpeg,image/png"/></label>
      {message && <p className="auth-message auth-message-error" role="alert">{message}</p>}
      <button className="recipe-submit" disabled={saving}>{saving ? 'Saxlanılır…' : 'Dəyişiklikləri saxla'}</button>
    </form>
  </section>
}

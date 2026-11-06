'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { onAuthStateChanged } from 'firebase/auth'
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, where } from 'firebase/firestore'
import { auth, db, firebaseConfigured } from '../../lib/firebase'

export default function ReseptYaratPage() {
  const [recipes, setRecipes] = useState([])
  const [saved, setSaved] = useState(false)
  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('error')

  useEffect(() => {
    if (!firebaseConfigured || !auth) {
      setAuthReady(true)
      return
    }
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setAuthReady(true)
    })
  }, [])

  useEffect(() => {
    if (!authReady || !user || !db) return
    const ownRecipes = query(collection(db, 'recipes'), where('ownerId', '==', user.uid))
    return onSnapshot(ownRecipes, (snapshot) => {
      const items = snapshot.docs.map((recipeDoc) => ({ id: recipeDoc.id, ...recipeDoc.data() }))
      items.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
      setRecipes(items)
      setMessage('')
    }, (error) => {
      setMessageType('error')
      setMessage(error.code === 'permission-denied'
        ? 'Firestore qaydaları bu reseptləri oxumağa icazə vermir. Aşağıdakı təhlükəsiz qaydaları Firebase Console-da yayımla.'
        : 'Reseptləri Firebase-dən yükləmək mümkün olmadı. Bağlantını yoxlayıb yenilə.')
    })
  }, [authReady, user])

  async function handleSubmit(event) {
    event.preventDefault()
    if (!user || !db) return
    const data = new FormData(event.currentTarget)
    const form = event.currentTarget
    const recipe = {
      ad: String(data.get('ad')).trim(),
      kateqoriya: String(data.get('kateqoriya')),
      muddet: String(data.get('muddet')).trim(),
      tesvir: String(data.get('tesvir')).trim(),
      inqrediyentler: String(data.get('inqrediyentler')).split('\n').map((item) => item.trim()).filter(Boolean),
      addimlar: String(data.get('addimlar')).split('\n').map((item) => item.trim()).filter(Boolean),
      ownerId: user.uid,
      createdAt: serverTimestamp(),
    }
    setSaving(true)
    setMessage('')
    try {
      await addDoc(collection(db, 'recipes'), recipe)
      form.reset()
      setSaved(true)
      window.setTimeout(() => setSaved(false), 3500)
    } catch (error) {
      setMessageType('error')
      setMessage(error.code === 'permission-denied'
        ? 'Firebase bu əməliyyata icazə vermədi. Firestore qaydalarında bu istifadəçiyə öz reseptini əlavə etməyə icazə olmalıdır.'
        : 'Resepti Firebase-də yadda saxlamaq alınmadı. İnternet bağlantısını yoxla və yenidən cəhd et.')
    } finally {
      setSaving(false)
    }
  }

  async function removeRecipe(id) {
    if (!db) return
    try {
      await deleteDoc(doc(db, 'recipes', id))
    } catch {
      setMessageType('error')
      setMessage('Resepti silmək alınmadı. Firestore qaydalarını yoxla.')
    }
  }

  if (!firebaseConfigured || !auth || !db) return <section className="empty-state"><h1>Firebase sazlanmayıb</h1><p>Firestore istifadə etmək üçün .env.local faylındakı Firebase parametrlərini yoxla.</p></section>
  if (!authReady) return <div className="loading-state"><span className="loading-spinner" /><p>Hesab yoxlanır…</p></div>
  if (!user) return <section className="empty-state"><h1>Resept yaratmaq üçün daxil ol</h1><p>Reseptlər Firebase-də sənin hesabına bağlanacaq.</p><Link className="button" href="/login">Daxil ol</Link></section>

  return (
    <section className="create-recipe-page">
      <div className="page-intro create-recipe-intro">
        <p className="eyebrow">Öz mətbəxindən</p>
        <h1>Reseptini paylaş</h1>
        <p>Ən sevdiyin yeməyi yadda saxla və öz reseptlər kolleksiyanı yarat.</p>
      </div>
      <div className="create-recipe-layout">
        <form className="recipe-form" onSubmit={handleSubmit}>
          <div className="recipe-form-heading"><span className="recipe-form-icon">✿</span><div><h2>Yeni resept</h2><p>Bütün məlumatları doldur, reseptin hazır olsun.</p></div></div>
          <label className="recipe-field">Reseptin adı<input name="ad" placeholder="Məsələn, nənəmin plovu" required maxLength={80} /></label>
          <div className="recipe-fields-row">
            <label className="recipe-field">Kateqoriya<select name="kateqoriya" defaultValue="Əsas yeməklər"><option>Əsas yeməklər</option><option>Şorbalar</option><option>Salatlar</option><option>Desertlər</option><option>İçkilər</option><option>Digər</option></select></label>
            <label className="recipe-field">Hazırlanma müddəti<input name="muddet" placeholder="45 dəqiqə" required maxLength={30} /></label>
          </div>
          <label className="recipe-field">Qısa təsvir<textarea name="tesvir" rows={3} placeholder="Bu resepti xüsusi edən nədir?" required maxLength={300} /></label>
          <label className="recipe-field">Ərzaqlar <span className="field-hint">Hər ərzağı yeni sətirdə yaz</span><textarea name="inqrediyentler" rows={5} placeholder={'2 stəkan düyü\n300 q toyuq\nDuz və istiot'} required /></label>
          <label className="recipe-field">Hazırlanma qaydası <span className="field-hint">Hər addımı yeni sətirdə yaz</span><textarea name="addimlar" rows={5} placeholder={'Düyünü yuyub islat.\nToyuğu ədviyyatla bişir.\nHamısını dəmə qoy.'} required /></label>
          <button type="submit" className="recipe-submit" disabled={saving}>{saving ? 'Firebase-də saxlanır…' : 'Resepti yadda saxla'} <span aria-hidden="true">→</span></button>
          {saved && <p className="recipe-saved" role="status">Resept yadda saxlandı!</p>}
          {message && <p className="auth-message auth-message-error" role="alert">{message}</p>}
        </form>
        <aside className="recipe-create-aside"><span className="aside-leaf">✳</span><h2>Hər reseptin öz hekayəsi var.</h2><p>Ən gözəl yeməklər paylaşıldıqca daha da dadlı olur. Ailə reseptlərini burada topla.</p><div className="aside-tip"><strong>Kiçik məsləhət</strong><span>Ərzaqları və bişirmə addımlarını ayrı-ayrı sətirlərdə yaz ki, oxumaq rahat olsun.</span></div></aside>
      </div>
      {recipes.length > 0 && <section className="my-recipes"><div className="section-heading"><div><p className="eyebrow">Sənin kolleksiyan</p><h2>Yaratdığım reseptlər</h2></div><span>{recipes.length} resept</span></div><div className="recipe-grid">{recipes.map((recipe) => <article className="recipe-card user-recipe-card" key={recipe.id}><div className="recipe-card-content"><span className="recipe-category">{recipe.kateqoriya}</span><h3>{recipe.ad}</h3><p>{recipe.tesvir}</p><p className="recipe-time">◷ &nbsp;{recipe.muddet}</p><details><summary>Ərzaqlar və hazırlanma</summary><strong>Ərzaqlar</strong><ul>{recipe.inqrediyentler.map((item, index) => <li key={index}>{item}</li>)}</ul><strong>Hazırlanma qaydası</strong><ol>{recipe.addimlar.map((item, index) => <li key={index}>{item}</li>)}</ol></details><button type="button" className="remove-recipe" onClick={() => removeRecipe(recipe.id)}>Resepti sil</button></div></article>)}</div></section>}
      {message && <p className="auth-message auth-message-error" role="alert">{message}</p>}
      <p className="recipe-storage-note"><Link href="/reseptler">Hazır reseptlərə bax →</Link> &nbsp; Reseptlərin Firestore-da saxlanılır və hesabınla sinxronlanır.</p>
    </section>
  )
}

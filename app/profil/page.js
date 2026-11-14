'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { EmailAuthProvider, onAuthStateChanged, reauthenticateWithCredential, sendPasswordResetEmail, updateEmail, updatePassword, updateProfile } from 'firebase/auth'
import { collection, doc, getCountFromServer, getDoc, getDocs, onSnapshot, query, serverTimestamp, setDoc, where } from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { auth, db, firebaseConfigured, storage } from '../../lib/firebase'

const ilkinProfil = { fullName: '', username: '', bio: '', location: '', website: '', favoriteCuisines: ['Azərbaycan'], avatarUrl: '', coverUrl: '', profileVisibility: 'public', notifications: { comments: true, likes: true, updates: false } }
const mətbəxlər = ['Azərbaycan', 'İtalyan', 'Aralıq dənizi', 'Türk', 'Asiya', 'Fransız']
const bölmələr = [
  { id: 'personal', label: 'Şəxsi məlumatlar', icon: '♙' },
  { id: 'account', label: 'Hesab və təhlükəsizlik', icon: '♙' },
  { id: 'notifications', label: 'Bildirişlər', icon: '♧' },
  { id: 'privacy', label: 'Məxfilik', icon: '♢' },
]

function authXətası(error) {
  const mesajlar = {
    'auth/wrong-password': 'Cari parol düzgün deyil.',
    'auth/invalid-credential': 'Cari parol düzgün deyil. E-poçt və parol hesabından istifadə etdiyini yoxla.',
    'auth/weak-password': 'Yeni parol ən azı 6 simvol olmalıdır.',
    'auth/email-already-in-use': 'Bu e-poçtla artıq hesab mövcuddur.',
    'auth/invalid-email': 'E-poçt ünvanı düzgün deyil.',
    'auth/requires-recent-login': 'Təhlükəsizlik üçün hesabdan çıxıb yenidən daxil ol və təkrar cəhd et.',
    'auth/too-many-requests': 'Çox sayda cəhd edildi. Bir az sonra yenidən yoxla.',
    'permission-denied': 'Firebase icazə vermədi. Firestore qaydalarını yayımla.',
    'firestore/permission-denied': 'Firebase icazə vermədi. Firestore qaydalarını yayımla.',
    'storage/unauthorized': 'Şəkil yükləməyə icazə yoxdur. Storage qaydalarını yayımla.',
    'storage/bucket-not-found': 'Firebase Storage aktiv deyil və ya bucket sazlanmayıb.',
    'storage/unknown': 'Şəkil yüklənmədi. Firebase Storage xidmətini yoxla.',
  }
  return mesajlar[error?.code] || `Əməliyyat alınmadı${error?.code ? ` (${error.code})` : ''}. Firebase sazlamasını və qaydalarını yoxla.`
}

function UploadIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h3l1.5-2h7L17 7h3v12H4z"/><circle cx="12" cy="13" r="3.5"/></svg> }

export default function ProfilPage() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(ilkinProfil)
  const [loading, setLoading] = useState(Boolean(auth))
  const savedProfile = useRef(ilkinProfil)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [activeSection, setActiveSection] = useState('personal')
  const [securityBusy, setSecurityBusy] = useState(false)
  const [recipes, setRecipes] = useState([])
  const [recipesLoading, setRecipesLoading] = useState(Boolean(auth))
  const [recipesError, setRecipesError] = useState('')
  const [recipeStats, setRecipeStats] = useState({ likes: 0, rating: '—' })

  useEffect(() => {
    if (!auth) return
    let unsubscribeRecipes = null
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      if (!currentUser) { setRecipes([]); setRecipesLoading(false); setLoading(false); return }
      setRecipesLoading(true)
      const ownRecipes = query(collection(db, 'recipes'), where('ownerId', '==', currentUser.uid))
      unsubscribeRecipes?.()
      unsubscribeRecipes = onSnapshot(ownRecipes, (snapshot) => {
        const items = snapshot.docs.map((recipeDoc) => ({ id: recipeDoc.id, ...recipeDoc.data() }))
        items.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
        setRecipes(items)
        setRecipesError('')
        setRecipesLoading(false)
        Promise.all(items.map(async (item) => {
          const [likes, ratings] = await Promise.all([
            getCountFromServer(collection(db, 'recipes', item.id, 'likes')),
            getDocs(collection(db, 'recipes', item.id, 'ratings')),
          ])
          return { likes: likes.data().count, ratings: ratings.docs.map((rating) => Number(rating.data().value || 0)) }
        })).then((values) => {
          const votes = values.flatMap((value) => value.ratings)
          setRecipeStats({ likes: values.reduce((sum, value) => sum + value.likes, 0), rating: votes.length ? (votes.reduce((sum, value) => sum + value, 0) / votes.length).toFixed(1) : '—' })
        }).catch(() => {})
      }, (recipeError) => {
        setRecipesError(authXətası(recipeError))
        setRecipesLoading(false)
      })
      try {
        const snapshot = await getDoc(doc(db, 'users', currentUser.uid))
        const data = snapshot.exists() ? snapshot.data() : {}
        const loadedProfile = { ...ilkinProfil, ...data, fullName: data.fullName || currentUser.displayName || '', avatarUrl: data.avatarUrl || currentUser.photoURL || '', notifications: { ...ilkinProfil.notifications, ...(data.notifications || {}) } }
        setProfile(loadedProfile)
        savedProfile.current = loadedProfile
      } catch (loadError) {
        const fallbackProfile = { ...ilkinProfil, fullName: currentUser.displayName || '', avatarUrl: currentUser.photoURL || '' }
        setProfile(fallbackProfile)
        savedProfile.current = fallbackProfile
        setError(authXətası(loadError))
      } finally { setLoading(false) }
    })
    return () => { unsubscribeAuth(); unsubscribeRecipes?.() }
  }, [])

  function change(field, value) { setProfile((current) => ({ ...current, [field]: value })) }

  async function uploadImage(event, field) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      setError('Şəkil JPG və ya PNG formatında, ən çoxu 5 MB olmalıdır.')
      event.target.value = ''
      return
    }
    if (!user || !storage) { setError('Şəkil yükləmək üçün Firebase Storage sazlanmalıdır.'); return }
    setError('')
    setMessage('Şəkil yüklənir…')
    try {
      const path = `users/${user.uid}/${field}-${Date.now()}-${file.name.replace(/[^\w.-]/g, '-')}`
      const imageRef = ref(storage, path)
      await uploadBytes(imageRef, file, { contentType: file.type })
      const url = await getDownloadURL(imageRef)
      change(field, url)
      setMessage('Şəkil yükləndi. Dəyişikliyi yadda saxlamağı unutma.')
    } catch (uploadError) {
      setMessage('')
      setError(authXətası(uploadError))
    }
  }

  async function persistProfile() {
    if (!user || !db) return
    setSaving(true); setMessage(''); setError('')
    try {
      const cleanProfile = { ...profile, fullName: profile.fullName.trim(), username: profile.username.trim().replace(/^@/, '').toLowerCase(), bio: profile.bio.trim(), location: profile.location.trim(), website: profile.website.trim() }
      await updateProfile(user, { displayName: cleanProfile.fullName, photoURL: cleanProfile.avatarUrl || null })
      await setDoc(doc(db, 'users', user.uid), { ...cleanProfile, updatedAt: serverTimestamp() }, { merge: true })
      setProfile(cleanProfile)
      savedProfile.current = cleanProfile
      setMessage('Profil dəyişiklikləri yadda saxlanıldı.')
    } catch (saveError) {
      setError(authXətası(saveError))
    } finally { setSaving(false) }
  }

  async function saveProfile(event) {
    event.preventDefault()
    await persistProfile()
  }

  async function changeSecurity(event) {
    event.preventDefault()
    setError(''); setMessage(''); setSecurityBusy(true)
    const form = event.currentTarget
    const values = new FormData(form)
    const currentPassword = String(values.get('currentPassword') || '')
    const action = String(values.get('securityAction') || '')
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword)
      await reauthenticateWithCredential(user, credential)
      if (action === 'email') {
        const nextEmail = String(values.get('newEmail') || '').trim()
        await updateEmail(user, nextEmail)
        setMessage('E-poçt ünvanı yeniləndi. Firebase təsdiq məktubu göndəribsə, yeni ünvanı təsdiqlə.')
      } else {
        await updatePassword(user, String(values.get('newPassword') || ''))
        setMessage('Parol uğurla yeniləndi.')
      }
      form.reset()
    } catch (securityError) {
      setError(authXətası(securityError))
    } finally { setSecurityBusy(false) }
  }

  async function requestPasswordReset() {
    setError(''); setMessage('')
    try {
      await sendPasswordResetEmail(auth, user.email)
      setMessage(`Parolun yenilənməsi üçün keçid ${user.email} ünvanına göndərildi.`)
    } catch (resetError) { setError(authXətası(resetError)) }
  }

  if (loading) return <section className="profile-state"><span className="loading-spinner"/><p>Hesab yoxlanır…</p></section>
  if (!firebaseConfigured) return <section className="empty-state profile-state"><h1>Firebase sazlanmayıb</h1><p>Profil məlumatlarını saxlamaq üçün `.env.local` faylındakı Firebase parametrlərini tamamla.</p></section>
  if (!user) return <section className="empty-state profile-state"><h1>Profilinə daxil ol</h1><p>Şəxsi məlumatlarını redaktə etmək üçün əvvəlcə hesabına giriş et.</p><Link className="button" href="/login">Giriş et</Link></section>

  return (
    <div className="profile-page">
      <Link href="/resept-yarat" className="profile-back">← Reseptlərimə qayıt</Link>
      <header className="profile-intro"><h1>Profili redaktə et <span aria-hidden="true">— ✿</span></h1><p>Reseptlərin arxasındakı aşpaz haqqında bir az daha çox.</p></header>
      <div className="profile-statistics"><div><strong>{recipes.length}</strong><span>Resept</span></div><div><strong>{recipeStats.likes}</strong><span>Bəyənmə</span></div><div><strong>★ {recipeStats.rating}</strong><span>Orta reytinq</span></div></div>
      <div className="profile-layout">
        <aside className="profile-sidebar">
          <div className="profile-identity">
            {profile.avatarUrl ? <img src={profile.avatarUrl} alt="Profil şəkli"/> : <span className="profile-initials">{(profile.fullName || user.email || 'CB').slice(0, 1).toUpperCase()}</span>}
            <div><strong>{profile.fullName || 'CookBook aşpazı'}</strong><span>@{profile.username || 'istifadəçi'}</span></div>
          </div>
          <nav aria-label="Profil parametrləri">
            {bölmələr.map((item) => <button key={item.id} type="button" className={activeSection === item.id ? 'selected' : ''} aria-current={activeSection === item.id ? 'page' : undefined} onClick={() => { setActiveSection(item.id); setMessage(''); setError('') }}><span aria-hidden="true">{item.icon}</span><span>{item.label}</span></button>)}
          </nav>
        </aside>

        <div className="profile-content">
        {(message || error) && <p className={error ? 'profile-error profile-alert' : 'profile-success profile-alert'} role={error ? 'alert' : 'status'}>{error || message}</p>}
        {activeSection === 'personal' && <form className="profile-form" onSubmit={saveProfile}>
          <section className="profile-appearance" aria-labelledby="appearance-heading">
            <h2 id="appearance-heading">Profil görünüşü <span aria-hidden="true">— ✿</span></h2>
            <div className="profile-cover" style={profile.coverUrl ? { backgroundImage: `linear-gradient(90deg,rgba(40,35,25,.08),rgba(40,35,25,.02)),url("${profile.coverUrl}")` } : undefined}>
              <label className="upload-button cover-upload"><UploadIcon/>Üz qabığını dəyiş<input type="file" accept="image/jpeg,image/png" onChange={(event) => uploadImage(event, 'coverUrl')}/></label>
            </div>
            <div className="avatar-row">
              <div className="profile-avatar">{profile.avatarUrl ? <img src={profile.avatarUrl} alt="Profil şəkli"/> : <span>{(profile.fullName || user.email || 'CB').slice(0, 1).toUpperCase()}</span>}<label className="avatar-camera" aria-label="Profil şəklini dəyiş"><UploadIcon/><input type="file" accept="image/jpeg,image/png" onChange={(event) => uploadImage(event, 'avatarUrl')}/></label></div>
              <div className="avatar-upload-copy"><strong>Profil şəkli</strong><label className="upload-button"><UploadIcon/>Şəkil yüklə<input type="file" accept="image/jpeg,image/png" onChange={(event) => uploadImage(event, 'avatarUrl')}/></label></div>
              <small>JPG və ya PNG. Maksimum 5 MB.</small>
            </div>
          </section>

          <section className="profile-info">
            <h2>Şəxsi məlumatlar <span aria-hidden="true">— ✿</span></h2>
            <div className="profile-fields">
              <label className="profile-field">Tam ad<input value={profile.fullName} onChange={(e) => change('fullName', e.target.value)} autoComplete="name" maxLength={80} required/></label>
              <label className="profile-field">İstifadəçi adı<div className="username-input"><span>@</span><input value={profile.username} onChange={(e) => change('username', e.target.value)} maxLength={30} pattern="[A-Za-z0-9._-]*"/><span className="username-check">✓</span></div></label>
              <label className="profile-field profile-field-wide">Bio<textarea value={profile.bio} onChange={(e) => change('bio', e.target.value)} maxLength={160} rows={2}/><span className="bio-count">{profile.bio.length} / 160</span></label>
              <label className="profile-field">Məkan<input value={profile.location} onChange={(e) => change('location', e.target.value)} placeholder="Bakı, Azərbaycan" maxLength={80}/></label>
              <label className="profile-field">Veb sayt<input value={profile.website} onChange={(e) => change('website', e.target.value)} placeholder="cookbook.az" maxLength={120}/></label>
              <fieldset className="profile-field profile-field-wide cuisine-field"><legend>Sevimli mətbəxlər</legend><div>{mətbəxlər.map((name) => { const checked = profile.favoriteCuisines.includes(name); return <button key={name} type="button" className={checked ? 'cuisine-chip active' : 'cuisine-chip'} aria-pressed={checked} onClick={() => change('favoriteCuisines', checked ? profile.favoriteCuisines.filter((item) => item !== name) : [...profile.favoriteCuisines, name])}>{name}{checked && <span aria-hidden="true"> ×</span>}</button> })}</div></fieldset>
            </div>
          </section>
          <div className="profile-actions"><p>Profil məlumatların icma üzvlərinə görünür.</p><div><button className="profile-cancel" type="button" onClick={() => { setProfile(savedProfile.current); setMessage(''); setError('') }}>Ləğv et</button><button className="profile-save" type="submit" disabled={saving}>{saving ? 'Saxlanılır…' : 'Dəyişiklikləri saxla'}</button></div></div>
        </form>}

        {activeSection === 'account' && <section className="settings-panel">
          <div className="settings-heading"><span className="settings-icon">♙</span><div><h2>Hesab və təhlükəsizlik</h2><p>Giriş e-poçtunu və parolunu yenilə.</p></div></div>
          <div className="settings-account-summary"><span>E-poçt ünvanı</span><strong>{user.email || 'E-poçt mövcud deyil'}</strong><small>Hesabın bu ünvanla daxil olur.</small></div>
          <form className="settings-form" onSubmit={changeSecurity}>
            <h3>E-poçtu dəyiş</h3>
            <label className="profile-field">Yeni e-poçt<input type="email" name="newEmail" autoComplete="email" required/></label>
            <label className="profile-field">Cari parol<input type="password" name="currentPassword" autoComplete="current-password" required/></label>
            <input type="hidden" name="securityAction" value="email"/>
            <button className="profile-save" type="submit" disabled={securityBusy}>{securityBusy ? 'Yenilənir…' : 'E-poçtu yenilə'}</button>
          </form>
          <form className="settings-form" onSubmit={changeSecurity}>
            <h3>Parolu dəyiş</h3>
            <label className="profile-field">Yeni parol<input type="password" name="newPassword" autoComplete="new-password" minLength={6} required/></label>
            <label className="profile-field">Cari parol<input type="password" name="currentPassword" autoComplete="current-password" required/></label>
            <input type="hidden" name="securityAction" value="password"/>
            <button className="profile-save" type="submit" disabled={securityBusy}>{securityBusy ? 'Yenilənir…' : 'Parolu yenilə'}</button>
          </form>
          <div className="settings-reset"><div><strong>Parolu xatırlamırsan?</strong><p>E-poçtuna parol yeniləmə keçidi göndər.</p></div><button className="profile-cancel" type="button" onClick={requestPasswordReset}>Yeniləmə keçidi göndər</button></div>
        </section>}

        {activeSection === 'notifications' && <section className="settings-panel">
          <div className="settings-heading"><span className="settings-icon">♧</span><div><h2>Bildirişlər</h2><p>Hansı fəaliyyətlər barədə xəbər almaq istədiyini seç.</p></div></div>
          <div className="settings-options">
            {[
              ['comments', 'Reseptlərimə şərhlər', 'Şərhlər üçün bildiriş seçimini aktiv et.'],
              ['likes', 'Bəyənmələr', 'Bəyənmələr üçün bildiriş seçimini aktiv et.'],
              ['updates', 'CookBook yenilikləri', 'Tətbiq yenilikləri üçün bildiriş seçimini aktiv et.'],
            ].map(([key, title, description]) => <label className="setting-toggle" key={key}><span><strong>{title}</strong><small>{description}</small></span><input type="checkbox" checked={Boolean(profile.notifications?.[key])} onChange={(event) => change('notifications', { ...profile.notifications, [key]: event.target.checked })}/></label>)}
          </div>
          <div className="profile-actions"><p>Seçimlərin hesabında saxlanılır.</p><button className="profile-save" type="button" onClick={persistProfile} disabled={saving}>{saving ? 'Saxlanılır…' : 'Bildiriş seçimlərini saxla'}</button></div>
        </section>}

        {activeSection === 'privacy' && <section className="settings-panel">
          <div className="settings-heading"><span className="settings-icon">♢</span><div><h2>Məxfilik</h2><p>Profil məlumatlarını kimlərin görə biləcəyini idarə et.</p></div></div>
          <div className="settings-options">
            <label className={profile.profileVisibility === 'public' ? 'privacy-choice active' : 'privacy-choice'}><input type="radio" name="profileVisibility" value="public" checked={profile.profileVisibility === 'public'} onChange={() => change('profileVisibility', 'public')}/><span><strong>Açıq profil</strong><small>İcma üzvləri profil məlumatlarını görə bilər.</small></span><span className="privacy-choice-icon">◉</span></label>
            <label className={profile.profileVisibility === 'private' ? 'privacy-choice active' : 'privacy-choice'}><input type="radio" name="profileVisibility" value="private" checked={profile.profileVisibility === 'private'} onChange={() => change('profileVisibility', 'private')}/><span><strong>Şəxsi profil</strong><small>Profil məlumatlarını yalnız sən görə bilərsən.</small></span><span className="privacy-choice-icon">◉</span></label>
          </div>
          <div className="profile-actions"><p>Dəyişiklik yadda saxlandıqdan sonra tətbiq olunur.</p><button className="profile-save" type="button" onClick={persistProfile} disabled={saving}>{saving ? 'Saxlanılır…' : 'Məxfilik seçimini saxla'}</button></div>
        </section>}
        </div>
      </div>
      <section className="profile-recipes-section">
        <div className="section-heading"><div><p className="eyebrow">Sənin kolleksiyan</p><h2>Yaratdığım reseptlər</h2></div><div className="profile-recipes-heading-actions"><span>{recipes.length} resept</span><Link href="/sevimliler">Sevimlilər</Link><Link href="/resept-yarat">Yeni resept paylaş →</Link></div></div>
        {recipesError && <p className="auth-message auth-message-error" role="alert">{recipesError}</p>}
        {recipesLoading ? <div className="loading-state profile-recipes-loading"><span className="loading-spinner"/><p>Reseptlərin yüklənir…</p></div>
          : recipes.length ? <div className="recipe-grid">{recipes.map((recipe) => <article className="recipe-card" key={recipe.id}><div className="recipe-card-content"><span className="recipe-category">{recipe.kateqoriya}</span><h3>{recipe.ad}</h3><p>{recipe.tesvir}</p><p className="recipe-time">◷ &nbsp;{recipe.muddet}</p><details><summary>Ərzaqlar və hazırlanma</summary><strong>Ərzaqlar</strong><ul>{(recipe.inqrediyentler || []).map((item, index) => <li key={index}>{item}</li>)}</ul><strong>Hazırlanma qaydası</strong><ol>{(recipe.addimlar || []).map((item, index) => <li key={index}>{item}</li>)}</ol></details></div></article>)}</div>
            : <div className="empty-state profile-recipes-empty"><h3>Hələ resept paylaşmamısan</h3><p>Öz reseptini əlavə et, burada görünəcək.</p><Link className="button" href="/resept-yarat">Resept yarat</Link></div>}
      </section>
    </div>
  )
}

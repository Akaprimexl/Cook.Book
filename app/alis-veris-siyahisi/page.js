'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { onAuthStateChanged } from 'firebase/auth'
import { addDoc, collection, deleteDoc, doc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore'
import { auth, db, firebaseConfigured } from '../../lib/firebase'

export default function AlisVerisSiyahisiPage() {
  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(!auth)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(Boolean(auth))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!auth) return
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); setAuthReady(true); setLoading(Boolean(currentUser))
      if (!currentUser) setItems([])
    })
  }, [])

  useEffect(() => {
    if (!authReady) return
    if (!user || !db) return
    return onSnapshot(collection(db, 'users', user.uid, 'shoppingItems'), (snapshot) => {
      const rows = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
      rows.sort((a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0))
      setItems(rows); setError(''); setLoading(false)
    }, (loadError) => {
      setError(loadError.code === 'permission-denied' ? 'Siyahını istifadə etmək üçün Firestore qaydalarını yayımla.' : 'Alış-veriş siyahısı yüklənmədi.')
      setLoading(false)
    })
  }, [authReady, user])

  async function addItem(event) {
    event.preventDefault()
    if (!user || !db || saving) return
    const form = event.currentTarget
    const data = new FormData(form)
    const name = String(data.get('item') || '').trim()
    if (!name) return
    setSaving(true); setError('')
    try { await addDoc(collection(db, 'users', user.uid, 'shoppingItems'), { name, checked: false, createdAt: serverTimestamp() }); form.reset() }
    catch (writeError) { setError(writeError.code === 'permission-denied' ? 'Siyahını saxlamaq üçün Firestore qaydalarını yayımla.' : 'Məhsulu əlavə etmək alınmadı.') }
    finally { setSaving(false) }
  }

  async function updateItem(item, changes) {
    try { await updateDoc(doc(db, 'users', user.uid, 'shoppingItems', item.id), changes) }
    catch (writeError) { setError(writeError.code === 'permission-denied' ? 'Siyahını yeniləmək üçün Firestore qaydalarını yayımla.' : 'Məhsulu yeniləmək alınmadı.') }
  }

  async function removeItem(item) {
    try { await deleteDoc(doc(db, 'users', user.uid, 'shoppingItems', item.id)) }
    catch (writeError) { setError(writeError.code === 'permission-denied' ? 'Siyahını dəyişmək üçün Firestore qaydalarını yayımla.' : 'Məhsulu silmək alınmadı.') }
  }

  async function clearChecked() {
    if (!user || !db || !items.length) return
    const completed = items.filter((item) => item.checked)
    await Promise.all(completed.map(removeItem))
  }

  if (!firebaseConfigured) return <section className="empty-state"><h1>Firebase sazlanmayıb</h1><p>Alış-veriş siyahısı üçün Firebase konfiqurasiyasını yoxla.</p></section>
  if (!authReady) return <div className="loading-state"><span className="loading-spinner"/><p>Hesab yoxlanır…</p></div>
  if (!user) return <section className="empty-state"><h1>Alış-veriş siyahın</h1><p>Siyahını hesabında saxlamaq üçün daxil ol.</p><Link href="/login" className="button">Daxil ol</Link></section>

  const checkedCount = items.filter((item) => item.checked).length
  return <section className="shopping-page">
    <header className="page-intro"><p className="eyebrow">Bazarlıq planın</p><h1>Alış-veriş siyahısı</h1><p>Məhsulları qeyd et, siyahın hesabında saxlanacaq.</p></header>
    <form className="shopping-add-form" onSubmit={addItem}><label className="sr-only" htmlFor="shopping-item">Məhsulun adı</label><input id="shopping-item" name="item" placeholder="Məsələn, 2 stəkan düyü" maxLength={120} required/><button className="button" type="submit" disabled={saving}>{saving ? 'Əlavə edilir…' : '＋ Əlavə et'}</button></form>
    {error && <p className="auth-message auth-message-error" role="alert">{error}</p>}
    <section className="shopping-list-panel"><div className="section-heading"><div><h2>Məhsullar</h2><p>{items.length - checkedCount} qalıb · {checkedCount} alınıb</p></div>{checkedCount > 0 && <button className="shopping-clear" type="button" onClick={clearChecked}>Alınanları sil</button>}</div>
      {loading ? <div className="loading-state"><span className="loading-spinner"/><p>Siyahı yüklənir…</p></div> : items.length ? <ul className="shopping-items">{items.map((item) => <li key={item.id} className={item.checked ? 'shopping-item checked' : 'shopping-item'}><label><input type="checkbox" checked={Boolean(item.checked)} onChange={(event) => updateItem(item, { checked: event.target.checked })}/><span>{item.name}</span></label><button type="button" aria-label={`${item.name} məhsulunu sil`} onClick={() => removeItem(item)}>×</button></li>)}</ul> : <div className="shopping-empty"><span aria-hidden="true">🧺</span><h3>Siyahı boşdur</h3><p>Almalı olduğun məhsulları yuxarıdan əlavə et və ya reseptdən ərzaqları siyahıya göndər.</p><Link href="/reseptler">Reseptlərə bax →</Link></div>}
    </section>
  </section>
}

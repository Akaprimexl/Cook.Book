'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'

function ingredientName(item) {
  if (typeof item === 'string') return item.trim()
  return [item.olcu, item.ad].filter(Boolean).join(' ').trim()
}

export default function ShoppingAddButton({ ingredients, recipeName }) {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!auth) return
    return onAuthStateChanged(auth, setUser)
  }, [])

  async function addToList() {
    if (!user) { router.push('/login'); return }
    if (!db || busy) return
    const names = (ingredients || []).map(ingredientName).filter(Boolean)
    if (!names.length) { setMessage('Bu reseptdə ərzaq siyahısı yoxdur.'); return }
    setBusy(true); setMessage('')
    try {
      const batch = writeBatch(db)
      const items = collection(db, 'users', user.uid, 'shoppingItems')
      for (const name of names) batch.set(doc(items), { name, checked: false, recipeName, createdAt: serverTimestamp() })
      await batch.commit()
      setMessage(`${names.length} ərzaq alış-veriş siyahısına əlavə olundu.`)
    } catch (error) {
      setMessage(error.code === 'permission-denied' ? 'Alış-veriş siyahısı üçün Firestore qaydalarını yayımla.' : 'Ərzaqları siyahıya əlavə etmək alınmadı.')
    } finally { setBusy(false) }
  }

  return <div className="shopping-add-action"><button type="button" className="button button-outline-dark" onClick={addToList} disabled={busy}>{busy ? 'Əlavə edilir…' : '＋ Alış-veriş siyahısına əlavə et'}</button>{message && <span role="status">{message}</span>}</div>
}

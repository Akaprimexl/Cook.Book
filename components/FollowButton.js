'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { deleteDoc, doc, onSnapshot, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'

export default function FollowButton({ targetId }) {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [following, setFollowing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { if (auth) return onAuthStateChanged(auth, setUser) }, [])
  useEffect(() => {
    if (!user || !db || !targetId || user.uid === targetId) return
    return onSnapshot(doc(db, 'users', user.uid, 'following', targetId), (snapshot) => setFollowing(snapshot.exists()), () => setError('İzləmə məlumatı yüklənmədi.'))
  }, [user, targetId])

  async function toggle() {
    if (!user) { router.push('/login'); return }
    if (user.uid === targetId || busy) return
    setBusy(true); setError('')
    try {
      const batch = writeBatch(db)
      const followingRef = doc(db, 'users', user.uid, 'following', targetId)
      const followerRef = doc(db, 'users', targetId, 'followers', user.uid)
      if (following) { batch.delete(followingRef); batch.delete(followerRef) }
      else {
        batch.set(followingRef, { targetId, createdAt: serverTimestamp() })
        batch.set(followerRef, { followerId: user.uid, createdAt: serverTimestamp() })
      }
      await batch.commit()
    } catch (writeError) { setError(writeError.code === 'permission-denied' ? 'İzləmə üçün Firestore qaydalarını yayımla.' : 'İzləmə əməliyyatı alınmadı.') }
    finally { setBusy(false) }
  }

  if (user?.uid === targetId) return null
  return <div className="follow-control"><button className={following ? 'follow-button following' : 'follow-button'} type="button" onClick={toggle} disabled={busy}>{busy ? 'Gözlə…' : following ? 'İzləyirsən' : '+ İzlə'}</button>{error && <small role="alert">{error}</small>}</div>
}

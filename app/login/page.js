'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth, firebaseConfigured } from '../../lib/firebase'

function loginErrorMessage(code) {
  if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
    return 'E-poçt və ya parol yanlışdır.'
  }
  if (code === 'auth/invalid-email') return 'E-poçt ünvanını düzgün yaz.'
  if (code === 'auth/too-many-requests') return 'Çox sayda cəhd edildi. Bir az sonra yenidən yoxla.'
  return 'Giriş zamanı xəta baş verdi. Yenidən cəhd et.'
}

export default function LoginPage() {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('error')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    if (!firebaseConfigured || !auth) {
      setMessageType('error')
      setMessage('Firebase sazlaması tapılmadı. Layihənin əsas qovluğunda .env.local faylını doldur və serveri yenidən başlad.')
      return
    }

    const formData = new FormData(event.currentTarget)
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, formData.get('email'), formData.get('password'))
      router.push('/')
      router.refresh()
    } catch (error) {
      setMessageType('error')
      setMessage(loginErrorMessage(error.code))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <Link href="/" className="auth-brand"><span className="brand-mark" aria-hidden="true">✳</span> CookBook</Link>
        <p className="eyebrow auth-eyebrow">Yenidən xoş gəldin</p>
        <h1>Giriş</h1>
        <p className="auth-description">Sevdiyin reseptlərə qaldığın yerdən davam et.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="login-email">E-poçt</label>
            <input id="login-email" name="email" type="email" autoComplete="email" placeholder="ad@numune.az" required />
          </div>
          <div className="auth-field">
            <label htmlFor="login-password">Parol</label>
            <input id="login-password" name="password" type="password" autoComplete="current-password" placeholder="Parolunu daxil et" required />
          </div>
          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? 'Giriş edilir…' : 'Daxil ol'} <span aria-hidden="true">→</span>
          </button>
          {message && <p className={messageType === 'error' ? 'auth-message auth-message-error' : 'auth-message'} role="alert">{message}</p>}
        </form>

        <p className="auth-switch">Hesabın yoxdur? <Link href="/register">Qeydiyyatdan keç</Link></p>
      </div>
    </section>
  )
}

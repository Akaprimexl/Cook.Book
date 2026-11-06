'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { auth, firebaseConfigured } from '../../lib/firebase'

function registerErrorMessage(code) {
  if (code === 'auth/email-already-in-use') return 'Bu e-poçtla artıq hesab yaradılıb. Giriş etməyə çalış.'
  if (code === 'auth/invalid-email') return 'E-poçt ünvanını düzgün yaz.'
  if (code === 'auth/weak-password') return 'Parol ən azı 6 simvoldan ibarət olmalıdır.'
  return 'Qeydiyyat zamanı xəta baş verdi. Yenidən cəhd et.'
}

export default function RegisterPage() {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('error')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    const formData = new FormData(event.currentTarget)
    const password = formData.get('password')
    const confirmPassword = formData.get('password-confirm')

    if (confirmPassword && password !== confirmPassword) {
      setMessageType('error')
      setMessage('Parollar eyni deyil. Zəhmət olmasa yenidən yoxla.')
      return
    }
    if (!firebaseConfigured || !auth) {
      setMessageType('error')
      setMessage('Firebase sazlaması tapılmadı. Layihənin əsas qovluğunda .env.local faylını doldur və serveri yenidən başlad.')
      return
    }

    setLoading(true)
    try {
      const credential = await createUserWithEmailAndPassword(auth, formData.get('email'), password)
      const name = String(formData.get('name') || '').trim()
      if (name) await updateProfile(credential.user, { displayName: name })
      router.push('/')
      router.refresh()
    } catch (error) {
      setMessageType('error')
      setMessage(registerErrorMessage(error.code))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="auth-page auth-register">
      <header className="auth-topbar"><Link href="/" className="auth-brand"><img className="auth-logo" src="/cookbook-logo.png" alt="CookBook" /></Link><nav><Link href="/reseptler">Reseptlər</Link><Link href="/resept-yarat">İcma</Link><Link href="/haqqinda">Haqqında</Link><Link className="auth-search-link" href="/reseptler" aria-label="Resept axtar"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg></Link><Link className="auth-login-nav" href="/login">Giriş</Link><Link className="auth-top-cta" href="/register">Qeydiyyat</Link></nav></header>
      <div className="auth-panel">
      <div className="auth-card">
        <Link href="/" className="auth-brand"><span className="brand-mark" aria-hidden="true">✳</span> CookBook</Link>
        <p className="eyebrow auth-eyebrow">Öz resept dünyanı yarat</p>
        <h1>Qeydiyyat</h1>
        <p className="auth-description">Hesab yarat və sevdiyin dadları bir yerə topla.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="register-name">Ad <span className="optional-label">istəyə bağlı</span></label>
            <input id="register-name" name="name" type="text" autoComplete="name" placeholder="Adın" />
          </div>
          <div className="auth-field">
            <label htmlFor="register-email">E-poçt</label>
            <input id="register-email" name="email" type="email" autoComplete="email" placeholder="ad@numune.az" required />
          </div>
          <div className="auth-field">
            <label htmlFor="register-password">Parol</label>
            <input id="register-password" name="password" type="password" autoComplete="new-password" placeholder="Parol yarat" minLength={6} required />
          </div>
          <label className="auth-terms"><input type="checkbox" required /> <span>Şərtlər və Məxfilik siyasəti ilə razıyam</span></label>
          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? 'Hesab yaradılır…' : 'Qeydiyyatdan keç'} <span aria-hidden="true">→</span>
          </button>
          {message && <p className={messageType === 'error' ? 'auth-message auth-message-error' : 'auth-message'} role="alert">{message}</p>}
        </form>

        <p className="auth-switch">Hesabın var? <Link href="/login">Giriş et</Link></p>
      </div></div>
      <div className="auth-visual auth-visual-register"><img className="auth-visual-image" src="/auth/register-photo.jpg" alt="Pomidor və göyərti ilə hazırlanmış təzə salat" /></div>
    </section>
  )
}


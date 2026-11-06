'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { GoogleAuthProvider, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth'
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
  const [resetMessage, setResetMessage] = useState('')
  const [resetError, setResetError] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

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

  async function handlePasswordReset() {
    setResetMessage('')
    const email = document.getElementById('login-email')?.value.trim()
    if (!email) {
      setResetError(true)
      setResetMessage('Parolun yenilənməsi üçün əvvəlcə e-poçt ünvanını daxil et.')
      return
    }
    if (!firebaseConfigured || !auth) {
      setResetError(true)
      setResetMessage('Firebase sazlaması tapılmadı. .env.local faylını yoxla.')
      return
    }
    try {
      await sendPasswordResetEmail(auth, email)
      setResetError(false)
      setResetMessage('Parol yeniləmə keçidi e-poçtuna göndərildi.')
    } catch {
      setResetError(true)
      setResetMessage('Parol yeniləmə məktubu göndərilmədi. E-poçt ünvanını yoxla.')
    }
  }

  async function handleGoogleLogin() {
    setMessage('')
    if (!firebaseConfigured || !auth) {
      setMessageType('error')
      setMessage('Firebase sazlaması tapılmadı. Layihənin əsas qovluğunda .env.local faylını yoxla.')
      return
    }
    setLoading(true)
    try {
      await signInWithPopup(auth, new GoogleAuthProvider())
      router.push('/')
      router.refresh()
    } catch (error) {
      setMessageType('error')
      setMessage(error.code === 'auth/popup-closed-by-user' ? 'Google giriş pəncərəsi bağlandı.' : 'Google ilə giriş alınmadı. Firebase-də Google girişini aktiv et.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="auth-page auth-login">
      <header className="auth-topbar"><Link href="/" className="auth-brand"><img className="auth-logo" src="/cookbook-logo.png" alt="CookBook" /></Link><nav><Link href="/reseptler">Reseptlər</Link><Link href="/resept-yarat">İcma</Link><Link href="/haqqinda">Haqqında</Link><Link className="auth-search-link" href="/reseptler" aria-label="Resept axtar"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg></Link><Link className="auth-login-nav" href="/login">Giriş</Link><Link className="auth-top-cta" href="/register">Qeydiyyat</Link></nav></header>
      <div className="auth-visual auth-visual-login">
        <img className="auth-visual-image" src="/auth/login-photo.jpg" alt="Pomidor və reyhanla hazırlanmış pasta" />
      </div>
      <div className="auth-panel">
      <div className="auth-card">
        <div className="auth-flourish" aria-hidden="true"><span></span><b>❧</b><span></span></div>
        <h1>Xoş gəldin</h1>
        <p className="auth-description">Növbəti sevimli yeməyin buradan başlayır.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="login-email">E-poçt ünvanı</label>
            <div className="login-input-wrap"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="1"/><path d="m4 7 8 6 8-6"/></svg><input id="login-email" name="email" type="email" autoComplete="email" placeholder="siz@numune.az" required /></div>
          </div>
          <div className="auth-field">
            <label htmlFor="login-password">Parol</label>
            <div className="login-input-wrap"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg><input id="login-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Parolun" required /><button type="button" className="password-visibility" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Parolu gizlət' : 'Parolu göstər'}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></svg></button></div>
          </div>
          <div className="login-options"><label><input type="checkbox" name="remember" /> <span>Məni xatırla</span></label><button type="button" className="forgot-password" onClick={handlePasswordReset}>Parolu unutmusan?</button></div>
          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? 'Giriş edilir…' : 'Daxil ol'} <span aria-hidden="true">→</span>
          </button>
          {message && <p className={messageType === 'error' ? 'auth-message auth-message-error' : 'auth-message'} role="alert">{message}</p>}
          {resetMessage && <p className={resetError ? 'auth-message auth-message-error' : 'auth-message'} role="status">{resetMessage}</p>}
          <div className="auth-divider"><span></span><small>və ya</small><span></span></div>
          <button type="button" className="google-login" onClick={handleGoogleLogin} disabled={loading}><span className="google-g" aria-hidden="true">G</span> Google ilə davam et</button>
        </form>

        <p className="auth-switch">CookBook-da yenisən? <Link href="/register">Qeydiyyatdan keç</Link></p>
      </div></div>
    </section>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const kecidler = [
  { href: '/', ad: 'Ana səhifə' },
  { href: '/reseptler', ad: 'Reseptlər' },
  { href: '/haqqinda', ad: 'Haqqında' },
  { href: '/resept-yarat', ad: 'Resept yarat' },
]

const sosialLinkler = [
  {
    href: 'https://www.instagram.com/',
    ad: 'Instagram',
    ikon: <><rect x="3" y="3" width="18" height="18" rx="6" /><circle cx="12" cy="12" r="4" /><circle cx="18" cy="6" r="1" className="social-icon-fill" /></>,
  },
  {
    href: 'https://www.facebook.com/',
    ad: 'Facebook',
    ikon: <path d="M13.5 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.5 1.6-1.5h1.7V3.9c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3V10H7.3v3h2.8v8h3.4Z" />,
  },
  {
    href: 'https://www.tiktok.com/',
    ad: 'TikTok',
    ikon: <path d="M19.6 7.2a6.8 6.8 0 0 1-4.2-1.4v8.1a5.8 5.8 0 1 1-5-5.7v3.1a2.8 2.8 0 1 0 2 2.7V2.5h3a3.8 3.8 0 0 0 4.2 3.7v3Z" />,
  },
]

export default function Navbar() {
  const pathname = usePathname()
  return (
    <header className="navbar">
      <Link href="/" className="brand"><img className="brand-logo" src="/cookbook-logo.png" alt="CookBook" /></Link>
      <nav className="nav-links" aria-label="Əsas naviqasiya">
        {kecidler.map((kecid) => {
          const aktiv = pathname === kecid.href || (kecid.href !== '/' && pathname.startsWith(`${kecid.href}/`))
          return <Link key={kecid.href} href={kecid.href} className={aktiv ? 'nav-link active' : 'nav-link'} aria-current={aktiv ? 'page' : undefined}>{kecid.ad}</Link>
        })}
      </nav>
      <div className="navbar-actions">
        <div className="social-links" aria-label="Sosial şəbəkələr">
          {sosialLinkler.map(({ href, ad, ikon }) => (
            <a key={ad} href={href} className="social-link" aria-label={ad} title={ad} target="_blank" rel="noreferrer">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">{ikon}</svg>
            </a>
          ))}
        </div>
        <div className="navbar-auth"><Link href="/login" className="nav-login">Giriş</Link><Link href="/register" className="nav-cta">Qeydiyyat</Link></div>
      </div>
    </header>
  )
}

import './globals.css'
import Navbar from '../components/Navbar'

export const metadata = {
  title: 'CookBook — Resept Kitabı',
  description: 'Evdə hazırlamaq üçün Azərbaycan dilində reseptlər.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="az">
      <body>
        <Navbar />
        <main className="page-shell">{children}</main>
        <footer className="footer"><span>CookBook</span><span>Dadlı günlər üçün reseptlər</span></footer>
      </body>
    </html>
  )
}

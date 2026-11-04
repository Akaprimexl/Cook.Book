'use client'

import { useState } from 'react'

// İnteraktiv komponentdir: state, klik və checkbox-lar brauzerdə işləyir.
export default function ReseptDetallari({ resept }) {
  const [porsiya, setPorsiya] = useState(2)
  const [tamamlanan, setTamamlanan] = useState([])
  const emsal = porsiya / 2

  function addimiDeyis(index) {
    setTamamlanan((kohne) => kohne.includes(index)
      ? kohne.filter((item) => item !== index)
      : [...kohne, index])
  }

  function miqdariGoster(item) {
    if (item.miqdar === null || item.miqdar === undefined) return [item.olcu, item.ad].filter(Boolean).join(' ')
    const miqdar = item.miqdar * emsal
    const miqdarMetni = Number.isInteger(miqdar) ? miqdar : Number(miqdar.toFixed(2)).toLocaleString('az-AZ')
    return `${miqdarMetni} ${item.olcu} ${item.ad}`.trim()
  }

  return (
    <div className="interactive-recipe">
      <section className="detail-panel">
        <div className="section-heading">
          <h2>İnqrediyentlər</h2>
          <div className="serving-control" aria-label="Porsiya sayını dəyiş">
            <button type="button" onClick={() => setPorsiya((n) => Math.max(1, n - 1))} disabled={porsiya <= 1} aria-label="Bir porsiya azalt">−</button>
            <strong>{porsiya} porsiya</strong>
            <button type="button" onClick={() => setPorsiya((n) => Math.min(12, n + 1))} disabled={porsiya >= 12} aria-label="Bir porsiya artır">+</button>
          </div>
        </div>
        <ul className="ingredient-list">
          {resept.inqrediyentler.map((item, index) => <li key={`${item.ad}-${index}`}>{miqdariGoster(item)}</li>)}
        </ul>
      </section>
      <section className="detail-panel">
        <div className="section-heading"><h2>Hazırlanma qaydası</h2><p>{tamamlanan.length}/{resept.addimlar.length} addım</p></div>
        <ol className="steps checklist">
          {resept.addimlar.map((addim, index) => {
            const secilib = tamamlanan.includes(index)
            return <li key={`${index}-${addim}`} className={secilib ? 'step-done' : ''}>
              <label><input type="checkbox" checked={secilib} onChange={() => addimiDeyis(index)} /><span>{addim}</span></label>
            </li>
          })}
        </ol>
      </section>
    </div>
  )
}

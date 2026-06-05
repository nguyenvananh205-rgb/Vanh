import { useEffect, useRef } from 'react'
import { setConvLabels } from '../api/labels.js'

const S = {
  menu: {
    position: 'fixed', background: '#fff', border: '1px solid #e0e0e0', borderRadius: 10,
    boxShadow: '0 8px 30px rgba(0,0,0,0.15)', zIndex: 9999, minWidth: 220, overflow: 'hidden',
  },
  header: { padding: '10px 14px 6px', fontSize: 12, fontWeight: 700, color: '#888' },
  item: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px',
    cursor: 'pointer', fontSize: 14, color: '#222', transition: 'background .1s',
  },
  checkbox: { width: 16, height: 16, accentColor: '#0068ff', cursor: 'pointer' },
  dot: (color) => ({ width: 10, height: 10, borderRadius: '50%', background: color }),
  divider: { borderTop: '1px solid #f0f0f0', margin: '4px 0' },
  suggestBtn: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px 10px',
    cursor: 'pointer', fontSize: 13, color: '#0068ff', fontWeight: 600,
  },
}

export default function LabelContextMenu({ x, y, conv, labels, assignments, onUpdate, onClose }) {
  const menuRef = useRef(null)
  const currentLabels = assignments[conv.id] || []

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Adjust position so menu stays in viewport
  const style = { ...S.menu }
  const winW = window.innerWidth, winH = window.innerHeight
  const menuW = 220, menuH = labels.length * 36 + 100
  style.left = x + menuW > winW ? x - menuW : x
  style.top = y + menuH > winH ? y - menuH : y

  async function toggle(labelId) {
    const next = currentLabels.includes(labelId)
      ? currentLabels.filter(id => id !== labelId)
      : [...currentLabels, labelId]
    try {
      await setConvLabels(conv.id, next)
      onUpdate(conv.id, next)
    } catch { /* ignore */ }
  }

  return (
    <div ref={menuRef} style={style}>
      <div style={S.header}>GÁN NHÃN cho "{conv.name}"</div>
      {labels.map(label => (
        <div
          key={label.id}
          style={S.item}
          onClick={() => toggle(label.id)}
          onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <input
            type="checkbox"
            style={S.checkbox}
            checked={currentLabels.includes(label.id)}
            readOnly
          />
          <span style={{ fontSize: 16 }}>{label.emoji}</span>
          <div style={S.dot(label.color)} />
          <span>{label.name}</span>
        </div>
      ))}
    </div>
  )
}

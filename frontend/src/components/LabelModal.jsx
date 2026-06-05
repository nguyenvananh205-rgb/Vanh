import { useState } from 'react'
import { createLabel, updateLabel, deleteLabel } from '../api/labels.js'

const PRESET_COLORS = ['#ff6b6b', '#4dabf7', '#69db7c', '#ffa94d', '#da77f2', '#ff8787', '#63e6be', '#74c0fc']
const PRESET_EMOJIS = ['🏷️', '👨‍👩‍👧‍👦', '💼', '👥', '🛒', '❤️', '⭐', '📌', '🔔', '📁']

const S = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  modal: {
    background: '#fff', borderRadius: 14, width: 480, maxHeight: '85vh',
    display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    overflow: 'hidden',
  },
  header: {
    padding: '16px 20px', borderBottom: '1px solid #f0f0f0',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  title: { fontWeight: 700, fontSize: 16, color: '#111' },
  closeBtn: { background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#888', padding: '0 4px' },
  body: { flex: 1, overflowY: 'auto', padding: '16px 20px' },
  sectionTitle: { fontSize: 13, fontWeight: 700, color: '#555', marginBottom: 10 },
  labelRow: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
    borderRadius: 8, marginBottom: 4,
  },
  labelDot: (color) => ({
    width: 12, height: 12, borderRadius: '50%', background: color, flexShrink: 0,
  }),
  labelName: { flex: 1, fontSize: 14, color: '#222' },
  deleteBtn: {
    background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer',
    fontSize: 16, padding: '2px 6px',
  },
  divider: { borderTop: '1px solid #f0f0f0', margin: '16px 0' },
  input: {
    width: '100%', padding: '8px 12px', border: '1.5px solid #e0e0e0', borderRadius: 8,
    fontSize: 14, outline: 'none', marginBottom: 10,
  },
  colorGrid: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 },
  colorSwatch: (c, selected) => ({
    width: 26, height: 26, borderRadius: '50%', background: c, cursor: 'pointer',
    border: selected ? '3px solid #111' : '2px solid transparent', transition: 'border .15s',
  }),
  emojiGrid: { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 },
  emojiBtn: (selected) => ({
    fontSize: 20, cursor: 'pointer', padding: '4px 6px', borderRadius: 6,
    background: selected ? '#e8f0fe' : 'transparent', border: selected ? '1.5px solid #0068ff' : '1.5px solid transparent',
  }),
  addBtn: {
    width: '100%', padding: '9px 0', background: '#0068ff', color: '#fff',
    border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
  },
  error: { fontSize: 13, color: '#c62828', marginBottom: 8 },
}

export default function LabelModal({ labels, onClose, onLabelsChange }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [emoji, setEmoji] = useState('🏷️')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    if (!name.trim()) { setError('Tên nhãn không được để trống.'); return }
    setLoading(true)
    setError('')
    try {
      const label = await createLabel({ name: name.trim(), color, emoji })
      onLabelsChange([...labels, label])
      setName('')
    } catch {
      setError('Tạo nhãn thất bại.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(labelId) {
    try {
      await deleteLabel(labelId)
      onLabelsChange(labels.filter(l => l.id !== labelId))
    } catch { /* ignore */ }
  }

  return (
    <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={S.modal}>
        <div style={S.header}>
          <div style={S.title}>Quản lý nhãn</div>
          <button style={S.closeBtn} onClick={onClose}>×</button>
        </div>

        <div style={S.body}>
          {/* Existing labels */}
          <div style={S.sectionTitle}>Nhãn hiện có</div>
          {labels.length === 0 && (
            <div style={{ color: '#aaa', fontSize: 13, marginBottom: 12 }}>Chưa có nhãn nào.</div>
          )}
          {labels.map(label => (
            <div key={label.id} style={S.labelRow}>
              <span style={{ fontSize: 18 }}>{label.emoji}</span>
              <div style={S.labelDot(label.color)} />
              <div style={S.labelName}>{label.name}</div>
              <button style={S.deleteBtn} onClick={() => handleDelete(label.id)} title="Xóa nhãn">✕</button>
            </div>
          ))}

          <div style={S.divider} />

          {/* Create new label */}
          <div style={S.sectionTitle}>Tạo nhãn mới</div>

          <input
            style={S.input}
            placeholder="Tên nhãn (VD: Khách hàng)"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            onFocus={e => (e.target.style.borderColor = '#0068ff')}
            onBlur={e => (e.target.style.borderColor = '#e0e0e0')}
          />

          <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>Màu nhãn</div>
          <div style={S.colorGrid}>
            {PRESET_COLORS.map(c => (
              <div key={c} style={S.colorSwatch(c, c === color)} onClick={() => setColor(c)} />
            ))}
          </div>

          <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>Biểu tượng</div>
          <div style={S.emojiGrid}>
            {PRESET_EMOJIS.map(e => (
              <div key={e} style={S.emojiBtn(e === emoji)} onClick={() => setEmoji(e)}>{e}</div>
            ))}
          </div>

          {error && <div style={S.error}>{error}</div>}

          <button style={{ ...S.addBtn, opacity: loading ? 0.7 : 1 }} onClick={handleCreate} disabled={loading}>
            {loading ? 'Đang tạo...' : '+ Tạo nhãn'}
          </button>
        </div>
      </div>
    </div>
  )
}

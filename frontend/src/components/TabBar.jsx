import { useState } from 'react'
import LabelModal from './LabelModal.jsx'

const S = {
  bar: {
    display: 'flex', alignItems: 'center', overflowX: 'auto', background: '#fff',
    borderBottom: '1px solid #e8e8e8', padding: '0 8px', gap: 2, flexShrink: 0,
    scrollbarWidth: 'none',
  },
  tab: (active, color) => ({
    display: 'flex', alignItems: 'center', gap: 5, padding: '9px 12px',
    cursor: 'pointer', whiteSpace: 'nowrap', fontSize: 13, fontWeight: active ? 700 : 500,
    color: active ? (color || '#0068ff') : '#666',
    borderBottom: active ? `2px solid ${color || '#0068ff'}` : '2px solid transparent',
    transition: 'all .15s', userSelect: 'none',
  }),
  dot: (color) => ({
    width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0,
  }),
  addBtn: {
    marginLeft: 4, padding: '4px 10px', background: 'none', border: '1px dashed #ccc',
    borderRadius: 14, fontSize: 13, color: '#888', cursor: 'pointer', flexShrink: 0,
    transition: 'all .15s',
  },
}

export default function TabBar({ labels, activeTab, onTabChange, onLabelsChange }) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <div style={S.bar}>
        {/* "Tất cả" tab */}
        <div
          style={S.tab(activeTab === 'all', '#0068ff')}
          onClick={() => onTabChange('all')}
        >
          Tất cả
        </div>

        {labels.map(label => (
          <div
            key={label.id}
            style={S.tab(activeTab === label.id, label.color)}
            onClick={() => onTabChange(label.id)}
          >
            <span>{label.emoji}</span>
            <span>{label.name}</span>
          </div>
        ))}

        <button
          style={S.addBtn}
          onClick={() => setShowModal(true)}
          onMouseEnter={e => { e.target.style.borderColor = '#0068ff'; e.target.style.color = '#0068ff' }}
          onMouseLeave={e => { e.target.style.borderColor = '#ccc'; e.target.style.color = '#888' }}
          title="Thêm nhãn mới"
        >
          + Nhãn
        </button>
      </div>

      {showModal && (
        <LabelModal
          labels={labels}
          onClose={() => setShowModal(false)}
          onLabelsChange={onLabelsChange}
        />
      )}
    </>
  )
}

import { useState, useEffect, useRef, useCallback } from 'react'
import { getMessages, sendMessage } from '../api/zalo'

const S = {
  root: { flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: '#f0f2f5' },
  header: {
    background: '#fff', padding: '14px 20px', borderBottom: '1px solid #e8e8e8',
    display: 'flex', alignItems: 'center', flexShrink: 0,
  },
  avatar: (color) => ({
    width: 38, height: 38, borderRadius: '50%', background: color,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 700, fontSize: 15, marginRight: 12, flexShrink: 0,
  }),
  name: { fontWeight: 700, fontSize: 16, color: '#111' },
  type: { fontSize: 12, color: '#888', marginTop: 1 },
  refreshBtn: {
    marginLeft: 'auto', background: 'none', border: '1px solid #e0e0e0', borderRadius: 8,
    padding: '6px 12px', cursor: 'pointer', fontSize: 13, color: '#555', transition: 'all .2s',
  },
  messages: { flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 6 },
  msgGroup: (mine) => ({
    display: 'flex', flexDirection: mine ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 8,
  }),
  bubble: (mine) => ({
    maxWidth: '68%', padding: '9px 14px', borderRadius: mine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
    background: mine ? '#0068ff' : '#fff', color: mine ? '#fff' : '#111',
    fontSize: 14, lineHeight: 1.5, wordBreak: 'break-word',
    boxShadow: mine ? 'none' : '0 1px 4px rgba(0,0,0,0.08)',
  }),
  time: { fontSize: 10, color: '#aaa', marginTop: 3, textAlign: 'center' },
  loading: { textAlign: 'center', padding: 20, color: '#aaa', fontSize: 14 },
  empty: { textAlign: 'center', padding: 40, color: '#aaa', fontSize: 14 },
  inputRow: {
    background: '#fff', borderTop: '1px solid #e8e8e8',
    padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'flex-end', flexShrink: 0,
  },
  textarea: {
    flex: 1, padding: '10px 14px', border: '1.5px solid #e0e0e0', borderRadius: 22,
    fontSize: 14, resize: 'none', maxHeight: 120, minHeight: 42,
    outline: 'none', fontFamily: 'inherit', lineHeight: 1.4, transition: 'border-color .2s',
  },
  sendBtn: (disabled) => ({
    width: 42, height: 42, borderRadius: '50%', background: disabled ? '#ccc' : '#0068ff',
    border: 'none', cursor: disabled ? 'default' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background .2s',
  }),
  loadMoreBtn: { textAlign: 'center', color: '#0068ff', cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: '8px 0' },
  placeholder: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb', fontSize: 16 },
}

const AVATAR_COLORS = ['#0068ff', '#f44336', '#4caf50', '#ff9800', '#9c27b0', '#00bcd4', '#e91e63', '#607d8b']
function avatarColor(id) {
  const idx = (parseInt(id?.slice(-4) || '0', 16) || 0) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}
function initials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return parts.length > 1 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name[0].toUpperCase()
}
function formatTime(ts) {
  if (!ts) return ''
  return new Date(parseInt(ts)).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
}

export default function MessageThread({ conversation, currentUserId }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [text, setText] = useState('')
  const [lastId, setLastId] = useState('0')
  const [hasMore, setHasMore] = useState(true)
  const bottomRef = useRef(null)
  const pollRef = useRef(null)

  const loadMessages = useCallback(async (prepend = false) => {
    if (!conversation) return
    setLoading(true)
    try {
      const id = prepend ? lastId : '0'
      const data = await getMessages(conversation.id, conversation.type || 0, id, 20)
      if (prepend) {
        setMessages(prev => [...data, ...prev])
      } else {
        setMessages(data)
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      }
      if (data.length < 20) setHasMore(false)
      if (data.length > 0 && !prepend) setLastId(data[0]?.global_mid || '0')
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [conversation, lastId])

  useEffect(() => {
    if (!conversation) return
    setMessages([])
    setLastId('0')
    setHasMore(true)
    loadMessages()

    // Poll every 5 seconds for new messages
    clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      try {
        const data = await getMessages(conversation.id, conversation.type || 0, '0', 20)
        setMessages(data)
      } catch { /* ignore */ }
    }, 5000)

    return () => clearInterval(pollRef.current)
  }, [conversation?.id])

  async function handleSend() {
    if (!text.trim() || sending) return
    const msg = text.trim()
    setText('')
    setSending(true)
    // Optimistic UI
    const tmp = { global_mid: 'tmp_' + Date.now(), content: msg, fromUid: currentUserId, ts: Date.now().toString(), _pending: true }
    setMessages(prev => [...prev, tmp])
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 30)
    try {
      await sendMessage(conversation.id, msg, conversation.type || 0)
      // Replace pending with real message on next poll
    } catch {
      setMessages(prev => prev.filter(m => m.global_mid !== tmp.global_mid))
      setText(msg)
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!conversation) {
    return <div style={S.placeholder}>Chọn một hội thoại để xem tin nhắn</div>
  }

  return (
    <div style={S.root}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.avatar(avatarColor(conversation.id))}>{initials(conversation.name)}</div>
        <div>
          <div style={S.name}>{conversation.name || 'Không có tên'}</div>
          <div style={S.type}>{conversation.type === 1 ? 'Nhóm' : 'Cá nhân'}</div>
        </div>
        <button
          style={S.refreshBtn}
          onClick={() => loadMessages()}
          onMouseEnter={e => { e.target.style.background = '#f0f0f0' }}
          onMouseLeave={e => { e.target.style.background = 'none' }}
        >
          ↻ Làm mới
        </button>
      </div>

      {/* Message list */}
      <div style={S.messages}>
        {hasMore && (
          <div style={S.loadMoreBtn} onClick={() => loadMessages(true)}>
            {loading ? 'Đang tải...' : '⬆ Tải thêm tin nhắn cũ'}
          </div>
        )}
        {messages.length === 0 && !loading && (
          <div style={S.empty}>Chưa có tin nhắn nào</div>
        )}
        {messages.map((msg, i) => {
          const mine = String(msg.fromUid) === String(currentUserId)
          const showTime = i === 0 || Math.abs(parseInt(messages[i - 1]?.ts || 0) - parseInt(msg.ts || 0)) > 300000
          return (
            <div key={msg.global_mid || i}>
              {showTime && <div style={S.time}>{formatTime(msg.ts)}</div>}
              <div style={S.msgGroup(mine)}>
                {!mine && (
                  <div style={{ ...S.avatar(avatarColor(String(msg.fromUid))), width: 28, height: 28, fontSize: 12, marginRight: 0 }}>
                    {initials(msg.dName || '')}
                  </div>
                )}
                <div style={{ ...S.bubble(mine), opacity: msg._pending ? 0.6 : 1 }}>
                  {!mine && msg.dName && (
                    <div style={{ fontSize: 11, color: '#0068ff', marginBottom: 3, fontWeight: 600 }}>{msg.dName}</div>
                  )}
                  {msg.content || ''}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={S.inputRow}>
        <textarea
          style={S.textarea}
          rows={1}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nhập tin nhắn... (Enter để gửi)"
          onFocus={e => (e.target.style.borderColor = '#0068ff')}
          onBlur={e => (e.target.style.borderColor = '#e0e0e0')}
        />
        <button
          style={S.sendBtn(!text.trim() || sending)}
          onClick={handleSend}
          disabled={!text.trim() || sending}
          title="Gửi tin nhắn"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

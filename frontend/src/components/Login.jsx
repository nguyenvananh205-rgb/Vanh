import { useState } from 'react'
import { login } from '../api/zalo'

const S = {
  overlay: {
    height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #0068ff 0%, #00c4ff 100%)',
  },
  card: {
    background: '#fff', borderRadius: 16, padding: '40px 36px', width: 480,
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
  },
  logo: { fontSize: 32, fontWeight: 800, color: '#0068ff', marginBottom: 4 },
  sub: { color: '#666', fontSize: 14, marginBottom: 28 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 6 },
  textarea: {
    width: '100%', minHeight: 140, padding: '10px 12px', border: '1.5px solid #e0e0e0',
    borderRadius: 8, fontSize: 12, fontFamily: 'monospace', resize: 'vertical',
    outline: 'none', transition: 'border-color .2s',
  },
  hint: {
    background: '#f0f7ff', border: '1px solid #b3d9ff', borderRadius: 8,
    padding: '12px 14px', marginTop: 14, fontSize: 13, color: '#0055cc', lineHeight: 1.6,
  },
  code: { background: '#d6eaff', borderRadius: 3, padding: '1px 5px', fontFamily: 'monospace', fontSize: 12 },
  btn: {
    marginTop: 20, width: '100%', padding: '12px 0', background: '#0068ff', color: '#fff',
    border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer',
    transition: 'background .2s',
  },
  error: { marginTop: 12, padding: '10px 12px', background: '#fff0f0', border: '1px solid #ffcdd2', borderRadius: 8, color: '#c62828', fontSize: 13 },
}

function parseCookies(raw) {
  if (!raw.trim()) return null
  try {
    const parsed = JSON.parse(raw)
    if (typeof parsed === 'object' && !Array.isArray(parsed)) return parsed
    if (Array.isArray(parsed)) {
      // DevTools JSON export format: [{name, value, ...}]
      return Object.fromEntries(parsed.map(c => [c.name, c.value]))
    }
  } catch {
    // Cookie string format: "key=value; key2=value2"
    const result = {}
    raw.split(';').forEach(part => {
      const idx = part.indexOf('=')
      if (idx > 0) {
        const k = part.slice(0, idx).trim()
        const v = part.slice(idx + 1).trim()
        if (k) result[k] = v
      }
    })
    return Object.keys(result).length > 0 ? result : null
  }
  return null
}

export default function Login({ onLogin }) {
  const [raw, setRaw] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    const cookies = parseCookies(raw)
    if (!cookies) {
      setError('Không thể parse cookies. Kiểm tra lại định dạng.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const result = await login(cookies)
      onLogin(result.user)
    } catch (err) {
      setError(err.response?.data?.detail || 'Đăng nhập thất bại. Kiểm tra lại cookies.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={S.overlay}>
      <div style={S.card}>
        <div style={S.logo}>Zalo Manager</div>
        <div style={S.sub}>Quản lý tin nhắn Zalo từ trình duyệt</div>

        <div style={S.hint}>
          <strong>Cách lấy cookies:</strong>
          <ol style={{ paddingLeft: 18, marginTop: 6 }}>
            <li>Mở <strong>chat.zalo.me</strong> và đăng nhập</li>
            <li>Nhấn <kbd>F12</kbd> → tab <strong>Application</strong> → <strong>Cookies</strong></li>
            <li>Chọn <code style={S.code}>https://chat.zalo.me</code></li>
            <li>Copy toàn bộ cookies (dạng <code style={S.code}>key=value; key2=value2</code>) hoặc export JSON</li>
          </ol>
        </div>

        <form onSubmit={handleSubmit}>
          <label style={{ ...S.label, marginTop: 18 }}>
            Dán cookies vào đây:
          </label>
          <textarea
            style={S.textarea}
            value={raw}
            onChange={e => setRaw(e.target.value)}
            placeholder={'zpw_usr=...; zpw_sek=...\nHoặc dạng JSON: [{"name":"zpw_usr","value":"..."}]'}
            onFocus={e => (e.target.style.borderColor = '#0068ff')}
            onBlur={e => (e.target.style.borderColor = '#e0e0e0')}
          />
          {error && <div style={S.error}>{error}</div>}
          <button
            type="submit"
            style={{ ...S.btn, opacity: loading ? 0.7 : 1 }}
            disabled={loading}
          >
            {loading ? 'Đang xác thực...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  )
}

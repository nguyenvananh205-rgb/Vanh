import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export async function login(cookies) {
  const { data } = await api.post('/auth/login', { cookies })
  return data
}

export async function logout() {
  const { data } = await api.post('/auth/logout')
  return data
}

export async function authStatus() {
  const { data } = await api.get('/auth/status')
  return data
}

export async function getConversations(lastId = '0', count = 30) {
  const { data } = await api.get('/conversations', { params: { last_id: lastId, count } })
  return data
}

export async function searchConversations(q) {
  const { data } = await api.get('/conversations/search', { params: { q } })
  return data
}

export async function getMessages(threadId, threadType = 0, lastId = '0', count = 20) {
  const { data } = await api.get(`/conversations/${threadId}/messages`, {
    params: { thread_type: threadType, last_id: lastId, count },
  })
  return data
}

export async function sendMessage(threadId, message, threadType = 0) {
  const { data } = await api.post(`/conversations/${threadId}/messages`, {
    message,
    thread_type: threadType,
  })
  return data
}

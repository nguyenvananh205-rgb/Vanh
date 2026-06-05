import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export async function getLabels() {
  const { data } = await api.get('/labels')
  return data  // { labels: [...], assignments: {...} }
}

export async function createLabel(payload) {
  const { data } = await api.post('/labels', payload)
  return data
}

export async function updateLabel(labelId, updates) {
  const { data } = await api.put(`/labels/${labelId}`, updates)
  return data
}

export async function deleteLabel(labelId) {
  const { data } = await api.delete(`/labels/${labelId}`)
  return data
}

export async function setConvLabels(convId, labelIds) {
  const { data } = await api.put(`/conversations/${convId}/labels`, { label_ids: labelIds })
  return data
}

export async function autoSuggest(conversations) {
  const { data } = await api.post('/labels/auto-suggest', { conversations })
  return data  // { conv_id: [label_ids] }
}

export async function fetchZaloLabels() {
  const { data } = await api.get('/labels/from-zalo')
  return data
}

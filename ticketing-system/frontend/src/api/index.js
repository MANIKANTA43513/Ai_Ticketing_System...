import axios from 'axios'

const BASE = "http://127.0.0.1:8000"

const api = axios.create({ baseURL: BASE })

export const ticketsApi = {
  list: (params) => api.get('/tickets', { params }).then(r => r.data),
  get: (id) => api.get(`/tickets/${id}`).then(r => r.data),
  create: (data) => api.post('/tickets', data).then(r => r.data),
  update: (id, data) => api.patch(`/tickets/${id}`, data).then(r => r.data),
  feedback: (id, helpful) => api.post(`/tickets/${id}/feedback`, { helpful }).then(r => r.data),
}

export const employeesApi = {
  list: (department) => api.get('/employees', { params: { department } }).then(r => r.data),
  create: (data) => api.post('/employees', data).then(r => r.data),
  update: (id, data) => api.put(`/employees/${id}`, data).then(r => r.data),
  deactivate: (id) => api.delete(`/employees/${id}`).then(r => r.data),
}

export const analyticsApi = {
  get: () => api.get('/analytics').then(r => r.data),
}

export default api

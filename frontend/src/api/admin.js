import { api } from './client.js'
export const getBuyers = () => api('/admin/buyers')
export const createBuyer = (payload) => api('/admin/buyers', { method:'POST', body: payload })
export const updateBuyer = (id, patch) => api(`/admin/buyers/${id}`, { method:'PUT', body: patch })
export const deleteBuyer = (id) => api(`/admin/buyers/${id}`, { method:'DELETE' })
export const setBuyerPassword = (id, password) => api(`/admin/buyers/${id}/set-password`, { method:'POST', body: { password } })
